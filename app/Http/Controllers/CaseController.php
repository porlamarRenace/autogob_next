<?php

namespace App\Http\Controllers;

use App\Models\SocialCase;
use App\Models\Category;
use App\Models\Supply;
use App\Models\MedicalService;
use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CaseController extends Controller
{
    use AuthorizesRequests;
    // Obtener árbol de categorías para el select
    public function getCategories()
    {
        // Traemos solo las categorías padres activas con sus hijos
        return Category::whereNull('parent_id')
            ->where('status', 'active')
            ->with(['children' => function($q) {
                $q->where('status', 'active');
            }])
            ->get();
    }

    // Buscar Insumos o Servicios (Polimórfico en la lógica)
    public function searchItems(Request $request)
    {
        $term = $request->input('query');
        $type = $request->input('type');
        
        if (!$term || strlen($term) < 2) return [];
        
        // Normalizamos término para búsqueda
        $termRaw = strtolower($term);

        if ($type === 'supply') {
            // ... (Lógica de insumos se mantiene igual) ...
            return Supply::where('name', 'ILIKE', "%{$term}%")
                ->where('status', 'active')
                ->limit(15)->get()
                ->map(fn($item) => [
                    'id' => $item->id, // ID Real
                    'unique_id' => 'sup_'.$item->id, // ID Único para React
                    'name' => $item->name,
                    'details' => $item->concentration,
                    'type' => 'supply',
                    'unit' => $item->unit,
                    'selection_detail' => $item->concentration // Lo que se guardará en BD
                ]);
        } else {
            // --- LÓGICA DE SERVICIOS CON JSON ---
            
            // 1. Buscamos Servicios que coincidan por nombre O que tengan el texto en el JSON
            // Nota: Postgres permite buscar texto dentro de JSONB facilmente
            $services = MedicalService::query()
                ->where('name', 'ILIKE', "%{$term}%")
                ->orWhereRaw("LOWER(specialties::text) LIKE ?", ["%{$termRaw}%"]) 
                ->with('institution')
                ->limit(20)
                ->get();

            $results = [];

            foreach ($services as $srv) {
                $institution = $srv->institution->name ?? 'General';
                
                // Decodificar el JSON de especialidades
                // Asumimos formato: [{"id":1,"nombre":"Ginecología General"}, ...]
                $specialties = $srv->specialties ? $srv->specialties : [];

                if (empty($specialties)) {
                    // CASO A: Servicio simple sin especialidades (Ej: "Medicina General")
                    $results[] = [
                        'id' => $srv->id,
                        'unique_id' => 'srv_'.$srv->id,
                        'name' => $srv->name,
                        'details' => $institution,
                        'type' => 'service',
                        'unit' => 'SERVICIO',
                        'selection_detail' => null // No hay sub-especialidad
                    ];
                } else {
                    // CASO B: Servicio con especialidades (El "Desglose")
                    foreach ($specialties as $spec) {
                        $specName = $spec['nombre'];

                        // FILTRO INTELIGENTE:
                        // Mostramos esta especialidad SI:
                        // 1. El usuario buscó el servicio padre (Ej: "Gine") -> Mostramos todas
                        // 2. O el usuario buscó la especialidad específica (Ej: "Obste") -> Mostramos solo esa
                        if (str_contains(strtolower($srv->name), $termRaw) || str_contains(strtolower($specName), $termRaw)) {
                            
                            $results[] = [
                                'id' => $srv->id, // El ID de BD sigue siendo el del Padre
                                'unique_id' => 'srv_'.$srv->id.'_'.$spec['id'], // ID único para el Key de React
                                'name' => "{$srv->name} - {$specName}", // Nombre visual compuesto
                                'details' => $institution,
                                'type' => 'service',
                                'unit' => 'SERVICIO',
                                'selection_detail' => $specName // IMPORTANTE: Esto guardaremos en la columna 'description'
                            ];
                        }
                    }
                }
            }
            
            return $results;
        }
    }

    // Guardar el Caso
    public function store(Request $request)
    {
        $request->validate([
            'citizen_id' => 'required|exists:citizens,id',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:categories,id',
            'channel' => 'required|string',
            'description' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required',
            'items.*.type' => 'required|in:supply,service',
            'items.*.quantity' => 'required|integer|min:1',
        ]);
        $activeCase = SocialCase::where('citizen_id', $request->citizen_id)
        ->where('category_id', $request->category_id)
        ->whereIn('status', ['open', 'in_progress'])
        ->first();

        if ($activeCase) {
            return response()->json([
                'message' => "El ciudadano ya tiene un caso activo (Folio: {$activeCase->case_number}). Debe cerrar ese caso antes de abrir uno nuevo."
            ], 422); 
        }
        return DB::transaction(function () use ($request) {
            // 1. Crear Cabecera del Caso
            $socialCase = SocialCase::create([
                'case_number' => 'AYU-' . date('Y') . '-' . Str::upper(Str::random(6)), // Generar folio
                'citizen_id' => $request->citizen_id,
                'user_id' => auth()->id(),
                'category_id' => $request->category_id,
                'subcategory_id' => $request->subcategory_id,
                'channel' => $request->channel,
                'description' => $request->description,
                'status' => 'open'
            ]);

            // 2. Insertar Items
            foreach ($request->items as $item) {
                // Determinar el modelo polimórfico
                $modelType = $item['type'] === 'supply' ? Supply::class : MedicalService::class;

                $socialCase->items()->create([
                    'itemable_id' => $item['id'],
                    'itemable_type' => $modelType,
                    'description' => $item['selection_detail'],
                    'quantity' => $item['quantity'],
                    'status' => 'pending'
                ]);
            }

            return response()->json(['message' => 'Caso creado exitosamente', 'case' => $socialCase]);
        });
    }
    public function show($id)
    {
        if (!auth()->user()->can('view cases')) {
            abort(403, 'No tiene permiso para ver casos.');
        }
        $case = SocialCase::with([
            'citizen.street.community.municipality',    
            'items.itemable', 
            'creator',        
            'category',
            'subcategory',
            'assignee'
        ])->findOrFail($id);

        $specialists = User::permission('review cases')
            ->where('id', '!=', auth()->id()) // Opcional: excluirse a sí mismo
            ->get(['id', 'name', 'email']);
        switch ($case->status) {
            case 'open':
                $case->status = 'Abierto';
                break;
            case 'in_progress':
                $case->status = 'En_progreso';
                break;
            case 'in_review':
                $case->status = 'En_revision';
                break;
        }
        return Inertia::render('cases/review', [
            'socialCase' => $case,
            'specialists' => $specialists,
            'can'=>[
                'assign' => auth()->user()->can('assign cases'),
                'review' => auth()->user()->can('review cases'),
            ]
        ]);
    }
    public function assign(Request $request, $id)
    {
        if (!auth()->user()->can('assign cases')) {
            abort(403, 'No tiene permiso para asignar casos.');
        }

        $case = SocialCase::findOrFail($id);

        $request->validate([
            'assigned_to' => 'required|exists:users,id',
            'note' => 'nullable|string'
        ]);

        $case->update([
            'assigned_to' => $request->assigned_to,
            'status' => 'in_progress'
        ]);
        
        return back()->with('message', 'Caso asignado correctamente.');
    }
    public function review(Request $request, $id)
    {
        if (!auth()->user()->can('review cases')) {
            abort(403, 'No tiene permiso para aprobar/rechazar.');
        }

        $case = SocialCase::findOrFail($id);

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:case_items,id',
            'items.*.status' => 'required|in:approved,rejected',
            'items.*.approved_qty' => 'nullable|numeric|min:0',
            'items.*.review_note' => 'nullable|string',
            'general_status' => 'required|in:approved,rejected,closed' 
        ]);

        return DB::transaction(function () use ($request, $case) {
            
            foreach ($request->items as $itemData) {
                $case->items()->where('id', $itemData['id'])->update([
                    'status' => $itemData['status'],
                    'approved_quantity' => $itemData['status'] === 'rejected' ? 0 : $itemData['approved_qty'],
                    'review_note' => $itemData['review_note'],
                    'reviewed_by' => auth()->id(),
                ]);
            }

            $case->update([
                'status' => $request->general_status, 
            ]);

            return response()->json(['message' => 'Revisión procesada exitosamente.']);
        });
    }
    public function index(Request $request)
    {
        if (!auth()->user()->can('view cases')) {
            abort(403, 'No tiene permiso para ver casos.');
        }
        $query = SocialCase::query()
            ->with(['citizen', 'category', 'creator']) 
            ->latest(); 

        if ($search = $request->input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('case_number', 'ILIKE', "%{$search}%")
                ->orWhereHas('citizen', function($c) use ($search) {
                    $c->where('first_name', 'ILIKE', "%{$search}%")
                    ->orWhere('last_name', 'ILIKE', "%{$search}%")
                    ->orWhere('identification_value', 'ILIKE', "%{$search}%");
                });
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'pending_all') {
                $query->whereIn('status', ['open', 'in_progress']);
            } else {
                $query->where('status', $status);
            }
        }

        $cases = $query->paginate(10)->withQueryString();

        return Inertia::render('cases/index', [
            'cases' => $cases,
            'filters' => $request->only(['search', 'status'])
        ]);
    }
}