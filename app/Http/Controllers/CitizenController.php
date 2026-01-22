<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Municipality;
use App\Models\Community;
use App\Models\Street;
use Illuminate\Support\Facades\DB;

class CitizenController extends Controller
{
    public function index()
    {
        return Inertia::render('cases/create');
    }
    public function searchApi(Request $request)
    {
        $request->validate([
            'identification_value' => 'required|string|min:5',
            'nationality' => 'nullable|in:V,E'
        ]);

        $query = Citizen::query()
            ->where('identification_value', 'LIKE', "%{$request->identification_value}%");

        if ($request->nationality) {
            $query->where('nationality', $request->nationality);
        }

        // Cargamos relaciones útiles como la dirección
        $citizen = $query->with(['street.community.municipality'])->first();

        if (!$citizen) {
            return response()->json(['found' => false, 'message' => 'Ciudadano no encontrado'], 404);
        }

        return response()->json([
            'found' => true,
            'citizen' => $citizen,
            'active_case' => $citizen->cases()
                ->whereIn('status', ['open', 'in_progress'])
                ->with('category')
                ->first()
        ]);
    }

    public function getMunicipalities()
    {
        return Municipality::whereHas('state', function($q){
            $q->where('name', 'Nueva Esparta');
        })->orderBy('name')->get();
    }

    public function getCommunities($municipality_id)
    {
        return Community::where('municipality_id', $municipality_id)
            ->orderBy('name')
            ->get();
    }

    public function getStreets($community_id)
    {
        return Street::where('community_id', $community_id)
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        // 1. Validaciones
        $validated = $request->validate([
            // Ciudadano
            'nationality' => 'required|in:V,E',
            'identification_value' => 'required|unique:citizens,identification_value',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'birth_date' => 'required|date',
            'gender' => 'required|in:M,F',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'street_id' => 'required|exists:streets,id',
            'reference_point' => 'nullable|string',
            
            // Profesional
            'profession' => 'nullable|string',
            'education_level' => 'nullable|string',

            // Salud (Validar booleanos)
            'has_diabetes' => 'boolean',
            'has_hypertension' => 'boolean',
            'has_cancer' => 'boolean',
            'is_disabled' => 'boolean',
            'blood_type' => 'nullable|string|max:5',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'medical_history_notes' => 'nullable|string',
            'disability_type' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($validated) {
            // 2. Crear Ciudadano
            $citizen = Citizen::create([
                'nationality' => $validated['nationality'],
                'identification_value' => $validated['identification_value'], // Mapeo
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'street_id' => $validated['street_id'],
                'reference_point' => $validated['reference_point'] ?? null,
                // Guardamos datos sociales en el JSON 'social_data' si tu tabla lo soporta
                'social_data' => [
                    'professional_data' => [
                        'profession' => $validated['profession'] ?? null,
                        'education_level' => $validated['education_level'] ?? null,
                    ],
                    'health_data' => [
                        'has_diabetes' => $validated['has_diabetes'] ?? false,
                        'has_hypertension' => $validated['has_hypertension'] ?? false,
                        'has_cancer' => $validated['has_cancer'] ?? false,
                        'is_disabled' => $validated['is_disabled'] ?? false,
                        'disability_type' => $validated['disability_type'] ?? null,
                        'blood_type' => $validated['blood_type'] ?? null,
                        'weight' => $validated['weight'] ?? null,
                        'height' => $validated['height'] ?? null,
                        'medical_history_notes' => $validated['medical_history_notes'] ?? null,
                    ]
                ]
            ]);

            return response()->json([
                'message' => 'Ciudadano registrado correctamente',
                'citizen' => $citizen
            ]);
        });
    }
}