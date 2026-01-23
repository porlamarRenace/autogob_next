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

class CaseController extends Controller
{
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
}