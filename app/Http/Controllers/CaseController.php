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
        $subcategoryId = $request->input('subcategory_id'); // Nuevo: filtrar por subcategoría
        
        if (!$term || strlen($term) < 2) return [];
        
        // Normalizamos término para búsqueda
        $termRaw = strtolower($term);

        if ($type === 'supply') {
            // Buscar insumos filtrando por subcategoría (category_id del insumo)
            $query = Supply::where('name', 'ILIKE', "%{$term}%")
                ->where('status', 'active');
            
            // Filtrar por subcategoría si se proporciona
            if ($subcategoryId) {
                $query->where('category_id', $subcategoryId);
            }
            
            return $query->limit(15)->get()
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
            'citizen_id' => 'required|exists:citizens,id', // Mantener por compatibilidad
            'applicant_id' => 'nullable|exists:citizens,id', // Solicitante (quien pide la ayuda)
            'beneficiary_id' => 'nullable|exists:citizens,id', // Beneficiario (quien recibe la ayuda)
            'category_id' => 'required|exists:categories,id',
            'channel' => 'required|string',
            'description' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required',
            'items.*.type' => 'required|in:supply,service',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // Determinar solicitante y beneficiario
        // Si no se especifica, citizen_id es tanto solicitante como beneficiario
        $applicantId = $request->applicant_id ?? $request->citizen_id;
        $beneficiaryId = $request->beneficiary_id ?? $request->citizen_id;

        // Validar perfil del BENEFICIARIO (quien recibe la ayuda)
        $beneficiary = Citizen::with('healthProfile')->findOrFail($beneficiaryId);
        $profileService = new \App\Services\ProfileValidationService();
        $profileErrors = $profileService->validateForCaseCreation($beneficiary);
        
        if (!empty($profileErrors)) {
            return response()->json([
                'message' => 'El perfil del beneficiario está incompleto',
                'errors' => $profileErrors,
                'missing_sections' => $profileService->getProfileStatus($beneficiary)['missing_sections']
            ], 422);
        }

        // Verificar caso activo para el BENEFICIARIO (no el solicitante)
        $activeCase = SocialCase::where('beneficiary_id', $beneficiaryId)
            ->where('category_id', $request->category_id)
            ->whereIn('status', ['open', 'in_progress'])
            ->first();

        // REGLA: No permitir abrir nuevo caso si ya tiene uno activo en la MISMA CATEGORÍA PRINCIPAL
        if ($activeCase) {
            return response()->json([
                'message' => "El beneficiario ya tiene un caso activo en esta categoría (Folio: {$activeCase->case_number}). Debe procesar ese caso antes de abrir uno nuevo."
            ], 422); 
        }

        return DB::transaction(function () use ($request, $applicantId, $beneficiaryId) {
            // 1. Crear Cabecera del Caso con applicant y beneficiary
            $socialCase = SocialCase::create([
                'case_number' => 'AYU-' . date('Y') . '-' . Str::upper(Str::random(6)),
                'citizen_id' => $beneficiaryId, // Mantener citizen_id para compatibilidad
                'applicant_id' => $applicantId,
                'beneficiary_id' => $beneficiaryId,
                'user_id' => auth()->id(),
                'category_id' => $request->category_id,
                // Subcategory ID ya no es obligatorio en la cabecera, pues los items definen esto
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

            // Retornar ID para redirección a PDF
            return response()->json([
                'message' => 'Caso creado exitosamente', 
                'case' => $socialCase,
                'pdf_url' => route('reports.case.pdf', $socialCase)
            ]);
        });
    }

    public function show($id)
    {
        if (!auth()->user()->can('view cases')) {
            abort(403, 'No tiene permiso para ver casos.');
        }
        $case = SocialCase::with([
            'citizen.street.community.municipality',    
            'items.assignedTo', // Cargar asignado del item
            'items.itemable' => function ($morphTo) {
                $morphTo->morphWith([
                    Supply::class => ['category'],
                ]);
            },
            'creator',        
            'category',
            'subcategory',
            'assignee',
            'media' 
        ])->findOrFail($id);

        $specialists = User::permission('review cases')
            ->where('id', '!=', auth()->id()) 
            ->get(['id', 'name', 'email']);

        switch ($case->status) {
            case 'open': $case->statusLabel = 'Abierto'; break;
            case 'in_progress': $case->statusLabel = 'En Progreso'; break;
            case 'in_review': $case->statusLabel = 'En Revisión'; break;
            default: $case->statusLabel = ucfirst($case->status); break;
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
            'item_ids' => 'nullable|array', // Opción para asignar items específicos
            'item_ids.*' => 'exists:case_items,id',
            'note' => 'nullable|string'
        ]);

        if ($request->filled('item_ids') && count($request->item_ids) > 0) {
            // Asignación Granular: Asignar solo items específicos
            $case->items()->whereIn('id', $request->item_ids)->update([
                'assigned_to' => $request->assigned_to
            ]);
            
            // Si al menos un item es asignado, el caso pasa a 'in_progress'
            if ($case->status === 'open') {
                $case->update(['status' => 'in_progress']);
            }
            
            $msg = 'Ítems asignados correctamente.';

        } else {
            // Asignación General: Asignar todo el caso (Cabecera + Items sin asignar)
            $case->update([
                'assigned_to' => $request->assigned_to,
                'status' => 'in_progress'
            ]);
            
            // Opcional: También asignar todos los items que no tengan asignado
            $case->items()->whereNull('assigned_to')->update([
                'assigned_to' => $request->assigned_to
            ]);

            $msg = 'Caso asignado correctamente al especialista.';
        }
        
        return back()->with('message', $msg);
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

    /**
     * Upload attachment to a case (max 2MB per file)
     */
    public function uploadAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|max:2048', // 2MB max
            'description' => 'nullable|string|max:255'
        ], [
            'file.required' => 'Debe seleccionar un archivo',
            'file.max' => 'El archivo no puede superar los 2MB'
        ]);

        $case = SocialCase::findOrFail($id);
        
        $media = $case->addMediaFromRequest('file')
            ->withCustomProperties(['description' => $request->description ?? ''])
            ->toMediaCollection('attachments');

        return response()->json([
            'success' => true,
            'message' => 'Archivo adjuntado correctamente',
            'attachment' => [
                'id' => $media->id,
                'name' => $media->file_name,
                'url' => $media->getUrl(),
                'size' => $media->size,
                'description' => $request->description ?? ''
            ]
        ]);
    }

    /**
     * Delete attachment from a case
     */
    public function deleteAttachment($caseId, $mediaId)
    {
        $case = SocialCase::findOrFail($caseId);
        $media = $case->media()->findOrFail($mediaId);
        
        $media->delete();

        return response()->json([
            'success' => true,
            'message' => 'Archivo eliminado correctamente'
        ]);
    }

    /**
     * Download attachment from a case
     */
    public function downloadAttachment($caseId, $mediaId)
    {
        $case = SocialCase::findOrFail($caseId);
        $media = $case->media()->findOrFail($mediaId);
        
        return response()->download($media->getPath(), $media->file_name);
    }

    /**
     * Mark an approved item as fulfilled (delivered/completed)
     */
    public function fulfillItem(Request $request, $caseId, $itemId)
    {
        if (!auth()->user()->can('review cases')) {
            abort(403, 'No tiene permiso para marcar ítems como cumplidos.');
        }

        $case = SocialCase::findOrFail($caseId);
        $item = $case->items()->findOrFail($itemId);

        // Solo se pueden cumplir ítems aprobados
        if ($item->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden marcar como cumplidos los ítems aprobados.'
            ], 422);
        }

        $item->update([
            'status' => 'fulfilled',
            'fulfilled_at' => now(),
            'fulfilled_by' => auth()->id()
        ]);

        // Si el ítem es un insumo (Supply), descontar del stock
        if ($item->itemable_type === 'supply' && $item->itemable) {
            $supply = $item->itemable;
            $quantityToDeduct = $item->approved_quantity ?? $item->quantity;
            
            if ($supply->current_stock >= $quantityToDeduct) {
                $supply->removeStock(
                    $quantityToDeduct,
                    'delivery',
                    auth()->id(),
                    "Entrega para caso #{$case->case_number}",
                    $item
                );
            }
        }

        // Verificar si todos los ítems están finalizados (fulfilled o rejected)
        $allItems = $case->items()->get();
        $allCompleted = $allItems->every(function ($i) {
            return in_array($i->status, ['fulfilled', 'rejected']);
        });

        $newCaseStatus = null;
        if ($allCompleted) {
            // Si hay al menos un ítem fulfilled, el caso está cerrado/completado
            // Si todos están rejected, el caso está rechazado
            $anyFulfilled = $allItems->contains('status', 'fulfilled');
            $newCaseStatus = $anyFulfilled ? 'closed' : 'rejected';
            
            $case->update(['status' => $newCaseStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => $allCompleted 
                ? 'Ítem marcado como cumplido. Caso ' . ($newCaseStatus === 'closed' ? 'cerrado' : 'rechazado') . '.'
                : 'Ítem marcado como cumplido.',
            'item' => $item->fresh(['fulfilledBy']),
            'case_status' => $case->fresh()->status,
            'case_closed' => $allCompleted
        ]);
    }
}