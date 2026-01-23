<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Municipality;
use App\Models\Community;
use App\Models\Street;
use Illuminate\Support\Facades\DB;
use App\Models\HealthProfile;
use Carbon\Carbon;

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
        $citizen = $query->with(['street.community.municipality','healthProfile'])->first();

        if (!$citizen) {
            return response()->json(['found' => false, 'message' => 'Ciudadano no encontrado'], 404);
        }
        $citizen->street_name = $citizen->street->name;
        $citizen->community_name = $citizen->street->community->name;
        $citizen->municipality_name = $citizen->street->community->municipality->name;
        return response()->json([
            'found' => true,
            'citizen' => $citizen,
            'active_case' => $citizen->cases()
                ->whereIn('status', ['open', 'in_progress'])
                ->with('category')
                ->first(),
            'history' => $citizen->cases()
                ->with(['category', 'subcategory', 'creator'])
                ->latest()
                ->get()
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
        $validated = $this->validateCitizen($request);

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
                    'profession' => $validated['profession'] ?? null,
                    'education_level' => $validated['education_level'] ?? null,
                ]
            ]);
            $this->saveHealthProfile($citizen, $validated);
            $citizen->street_name = $citizen->street->name;
            $citizen->community_name = $citizen->street->community->name;
            $citizen->municipality_name = $citizen->street->community->municipality->name;
            return response()->json([
                'message' => 'Ciudadano registrado correctamente',
                'citizen' => $citizen->load('healthProfile')
            ]);
        });
    }
    public function update(Request $request, $id)
    {
        $citizen = Citizen::findOrFail($id);
        
        // Validamos (excluyendo la cédula actual para unique)
        $validated = $this->validateCitizen($request, $citizen->id);

        return DB::transaction(function () use ($citizen, $validated) {
            // 1. Actualizar Ciudadano
            $citizen->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'street_id' => $validated['street_id'],
                'reference_point' => $validated['reference_point'] ?? null,
                'social_data' => [
                    'profession' => $validated['profession'] ?? null,
                    'education_level' => $validated['education_level'] ?? null,
                ]
            ]);

            // 2. Actualizar Salud
            $this->saveHealthProfile($citizen, $validated);

            return response()->json([
                'message' => 'Datos actualizados correctamente',
                'citizen' => $citizen->load('healthProfile')
            ]);
        });
    }
    // Función auxiliar para validación (DRY)
    private function validateCitizen(Request $request, $ignoreId = null)
    {
        $uniqueRule = 'unique:citizens,identification_value';
        if ($ignoreId) {
            $uniqueRule .= ',' . $ignoreId;
        }

        return $request->validate([
            'nationality' => 'required|in:V,E',
            'identification_value' => ['required', $ignoreId ? '' : $uniqueRule], // Solo validamos unique al crear
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'birth_date' => 'required|date',
            'gender' => 'required|in:M,F',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'street_id' => 'required|exists:streets,id',
            'reference_point' => 'nullable|string',
            
            'profession' => 'nullable|string',
            'education_level' => 'nullable|string',

            // Booleanos de Salud
            'has_diabetes' => 'boolean',
            'has_hypertension' => 'boolean',
            'has_cancer' => 'boolean',
            'has_allergies' => 'boolean',
            'has_alcoholism' => 'boolean',
            'has_drugs' => 'boolean',
            'was_operated' => 'boolean',
            'is_disabled' => 'boolean',
            
            // Específicas
            'has_mental_condition' => 'boolean',
            'has_eye_condition' => 'boolean',
            'has_dental_condition' => 'boolean',
            'has_hereditary_condition' => 'boolean',
            'has_kidney_condition' => 'boolean',
            'has_liver_condition' => 'boolean',
            'has_heart_condition' => 'boolean',
            'has_gastro_condition' => 'boolean',
            'has_skin_condition' => 'boolean',

            'blood_type' => 'nullable|string|max:5',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'medical_history_notes' => 'nullable|string',
            'disability_type' => 'nullable|string'
        ]);
    }

    // Función auxiliar para guardar salud (DRY)
    private function saveHealthProfile($citizen, $validated)
    {
        $citizen->healthProfile()->updateOrCreate(
            ['citizen_id' => $citizen->id],
            [
                'has_diabetes' => $validated['has_diabetes'] ?? false,
                'has_hypertension' => $validated['has_hypertension'] ?? false,
                'has_cancer' => $validated['has_cancer'] ?? false,
                'has_allergies' => $validated['has_allergies'] ?? false,
                'has_alcoholism' => $validated['has_alcoholism'] ?? false,
                'has_drugs' => $validated['has_drugs'] ?? false,
                'was_operated' => $validated['was_operated'] ?? false,
                
                'has_mental_condition' => $validated['has_mental_condition'] ?? false,
                'has_eye_condition' => $validated['has_eye_condition'] ?? false,
                'has_dental_condition' => $validated['has_dental_condition'] ?? false,
                'has_hereditary_condition' => $validated['has_hereditary_condition'] ?? false,
                'has_kidney_condition' => $validated['has_kidney_condition'] ?? false,
                'has_liver_condition' => $validated['has_liver_condition'] ?? false,
                'has_heart_condition' => $validated['has_heart_condition'] ?? false,
                'has_gastro_condition' => $validated['has_gastro_condition'] ?? false,
                'has_skin_condition' => $validated['has_skin_condition'] ?? false,

                'is_disabled' => $validated['is_disabled'] ?? false,
                'disability_type' => $validated['disability_type'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
                'weight' => $validated['weight'] ?? null,
                'height' => $validated['height'] ?? null,
                'notes' => $validated['medical_history_notes'] ?? null,
            ]
        );
    }
}