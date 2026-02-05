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

        $cedula = $request->identification_value;
        $nationality = $request->nationality ?? 'V';

        // 1. Buscar primero en BD local
        $citizen = Citizen::where('identification_value', $cedula)
            ->where('nationality', $nationality)
            ->with(['street.community.municipality', 'healthProfile'])
            ->first();

        $source = 'local';
        $wasCreated = false;

        // 2. Si no existe localmente, consultar API externa y crear
        if (!$citizen) {
            $lookupService = new \App\Services\PersonLookupService();
            $externalData = $lookupService->lookup($cedula);

            if (!$externalData || !$externalData['found']) {
                return response()->json([
                    'found' => false,
                    'source' => 'none',
                    'message' => 'Ciudadano no encontrado en registros locales ni externos'
                ], 404);
            }

            // Crear ciudadano con datos externos
            $citizen = Citizen::create([
                'nationality' => $externalData['nationality'] ?? $nationality,
                'identification_value' => $externalData['identification_value'] ?? $cedula,
                'first_name' => $externalData['first_name'] ?? '',
                'last_name' => $externalData['last_name'] ?? '',
                'birth_date' => $externalData['birth_date'] ?? null,
                'gender' => $externalData['gender'] ?? null,
                'phone' => !empty($externalData['phone']) ? $externalData['phone'] : null,
            ]);

            // Crear perfil de salud vacío
            $citizen->healthProfile()->create([
                'notes' => null,
                'blood_type' => null,
            ]);

            $citizen->load(['street.community.municipality', 'healthProfile']);
            $source = 'external';
            $wasCreated = true;
        }

        // 3. Agregar nombres de ubicación si existen
        if ($citizen->street) {
            $citizen->street_name = $citizen->street->name;
            $citizen->community_name = $citizen->street->community->name ?? null;
            $citizen->municipality_name = $citizen->street->community->municipality->name ?? null;
        }

        // 4. Verificar completitud del perfil
        $profileService = new \App\Services\ProfileValidationService();
        $profileStatus = $profileService->getProfileStatus($citizen);

        return response()->json([
            'found' => true,
            'source' => $source,
            'was_created' => $wasCreated,
            'citizen' => $citizen,
            'profile_complete' => $profileStatus['complete'],
            'profile_errors' => $profileStatus['errors'],
            'missing_sections' => $profileStatus['missing_sections'],
            'active_case' => $citizen->cases()
                ->whereIn('status', ['open', 'in_progress'])
                ->with('category')
                ->first(),
            'history' => $citizen->cases()
                ->with(['category', 'subcategory', 'creator'])
                ->latest()
                ->get(),
            'message' => $wasCreated 
                ? 'Ciudadano registrado desde sistema externo. Por favor complete los datos faltantes.' 
                : null
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
                'identification_value' => $validated['identification_value'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'birth_date' => $validated['birth_date'],
                'gender' => $validated['gender'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'street_id' => $validated['street_id'],
                'reference_point' => $validated['reference_point'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'representative_id' => $this->resolveRepresentativeId($validated['representative_cedula'] ?? null),
                // Guardamos datos sociales en el JSON 'social_data'
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
                'citizen' => $citizen->load(['healthProfile', 'representative'])
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
                'photo' => $validated['photo'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'representative_id' => $this->resolveRepresentativeId($validated['representative_cedula'] ?? null),
                'social_data' => [
                    'profession' => $validated['profession'] ?? null,
                    'education_level' => $validated['education_level'] ?? null,
                ]
            ]);

            // 2. Actualizar Salud
            $this->saveHealthProfile($citizen, $validated);

            return response()->json([
                'message' => 'Datos actualizados correctamente',
                'citizen' => $citizen->load(['healthProfile', 'representative', 'street', 'street.community', 'street.community.municipality'])
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

        // Validar si es menor de edad
        $birthDate = $request->input('birth_date');
        $isMinor = false;
        if ($birthDate) {
            $age = Carbon::parse($birthDate)->diffInYears(Carbon::now());
            $isMinor = $age < 18;
        }

        // Reglas base
        $rules = [
            'nationality' => 'required|in:V,E',
            'identification_value' => ['required', $ignoreId ? '' : $uniqueRule],
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'birth_date' => 'required|date|before_or_equal:today',
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

            'blood_type' => 'nullable|in:A+,A-,B+,B-,O+,O-,AB+,AB-',
            'weight' => 'nullable|numeric|min:0|max:500',
            'height' => 'nullable|numeric|min:0|max:300',
            'medical_history_notes' => 'nullable|string',
            'disability_type' => 'nullable|string',
            
            // Foto
            'photo' => 'nullable|string',
        ];

        // Si es menor, requerir representante
        if ($isMinor) {
            $rules['representative_cedula'] = 'required|exists:citizens,identification_value';
        } else {
            $rules['representative_cedula'] = 'nullable|exists:citizens,identification_value';
        }

        // Mensajes en español
        $messages = [
            'nationality.required' => 'La nacionalidad es obligatoria.',
            'nationality.in' => 'La nacionalidad debe ser V (Venezolano) o E (Extranjero).',
            'identification_value.required' => 'El número de cédula es obligatorio.',
            'identification_value.unique' => 'Este número de cédula ya está registrado en el sistema.',
            'first_name.required' => 'El nombre es obligatorio.',
            'first_name.max' => 'El nombre no puede tener más de 100 caracteres.',
            'last_name.required' => 'El apellido es obligatorio.',
            'last_name.max' => 'El apellido no puede tener más de 100 caracteres.',
            'birth_date.required' => 'La fecha de nacimiento es obligatoria.',
            'birth_date.date' => 'La fecha de nacimiento no tiene un formato válido.',
            'birth_date.before_or_equal' => 'La fecha de nacimiento no puede ser posterior a hoy.',
            'gender.required' => 'El género es obligatorio.',
            'gender.in' => 'El género debe ser M (Masculino) o F (Femenino).',
            'email.email' => 'El correo electrónico no tiene un formato válido.',
            'street_id.required' => 'Debe seleccionar una calle.',
            'street_id.exists' => 'La calle seleccionada no existe.',
            'blood_type.in' => 'El tipo de sangre debe ser uno de: A+, A-, B+, B-, O+, O-, AB+, AB-.',
            'weight.numeric' => 'El peso debe ser un número.',
            'weight.min' => 'El peso debe ser mayor a 0.',
            'weight.max' => 'El peso no puede exceder los 500 kg.',
            'height.numeric' => 'La altura debe ser un número.',
            'height.min' => 'La altura debe ser mayor a 0.',
            'height.max' => 'La altura no puede exceder los 300 cm.',
            'representative_cedula.required' => 'Los ciudadanos menores de edad deben tener un representante legal.',
            'representative_cedula.exists' => 'La cédula del representante no está registrada en el sistema.',
        ];

        return $request->validate($rules, $messages);
    }

    private function resolveRepresentativeId($cedula)
    {
        if (!$cedula) return null;
        $rep = Citizen::where('identification_value', $cedula)->first();
        return $rep ? $rep->id : null;
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

    /**
     * Upload citizen photo (max 2MB)
     */
    public function uploadPhoto(Request $request, $id)
    {
        $request->validate([
            'photo' => 'required|file|mimes:jpg,jpeg,png|max:2048' // 2MB max
        ], [
            'photo.required' => 'Debe seleccionar una imagen',
            'photo.mimes' => 'La imagen debe ser JPG, JPEG o PNG',
            'photo.max' => 'La imagen no puede superar los 2MB'
        ]);

        $citizen = Citizen::findOrFail($id);
        
        // Clear existing photo and add new one
        $citizen->clearMediaCollection('photo');
        $citizen->addMediaFromRequest('photo')
            ->toMediaCollection('photo');

        return response()->json([
            'success' => true,
            'message' => 'Foto actualizada correctamente',
            'photo_url' => $citizen->fresh()->photo_url
        ]);
    }

    /**
     * Delete citizen photo
     */
    public function deletePhoto($id)
    {
        $citizen = Citizen::findOrFail($id);
        $citizen->clearMediaCollection('photo');

        return response()->json([
            'success' => true,
            'message' => 'Foto eliminada correctamente'
        ]);
    }

    /**
     * Get profile completeness status for case creation
     */
    public function getProfileStatus($id)
    {
        $citizen = Citizen::with('healthProfile')->findOrFail($id);
        
        $service = new \App\Services\ProfileValidationService();
        $status = $service->getProfileStatus($citizen);

        return response()->json($status);
    }

    /**
     * Show citizen expedient (history)
     */
    public function expedient(Citizen $citizen)
    {
        $citizen->load(['street.community.municipality.state', 'healthProfile', 'representative']);

        // Casos como beneficiario (ayudas recibidas)
        $beneficiaryCases = $citizen->beneficiaryCases()
            ->with(['items.itemable', 'category', 'subcategory'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Casos como solicitante (gestiones realizadas)
        $applicantCases = $citizen->applicantCases()
            ->with(['category', 'subcategory', 'beneficiary'])
            ->where('applicant_id', '!=', $citizen->id) // Excluir donde es el mismo beneficiario (ya sale arriba)
            ->orderBy('created_at', 'desc')
            ->get();

        // Estadísticas
        $stats = [
            'total_cases_beneficiary' => $beneficiaryCases->count(),
            'total_cases_applicant' => $applicantCases->count(),
            'approved_items' => $beneficiaryCases->pluck('items')->flatten()->where('status', 'approved')->count(),
            'fulfilled_items' => $beneficiaryCases->pluck('items')->flatten()->where('status', 'fulfilled')->count(),
            'rejected_items' => $beneficiaryCases->pluck('items')->flatten()->where('status', 'rejected')->count(),
        ];

        return Inertia::render('citizens/expedient', [
            'citizen' => $citizen,
            'beneficiary_cases' => $beneficiaryCases,
            'applicant_cases' => $applicantCases,
            'stats' => $stats
        ]);
    }

    /**
     * Lookup person by cedula - first locally, then external API
     */
    public function lookupExternal(Request $request)
    {
        $request->validate([
            'cedula' => 'required|string|min:5|max:15',
            'nationality' => 'nullable|in:V,E'
        ]);

        $cedula = $request->input('cedula');
        $nationality = $request->input('nationality', 'V');

        // 1. First, search locally in our database
        $localCitizen = Citizen::where('identification_value', $cedula)
            ->where('nationality', $nationality)
            ->with(['street.community.municipality', 'healthProfile'])
            ->first();

        if ($localCitizen) {
            // Add location names if available
            if ($localCitizen->street) {
                $localCitizen->street_name = $localCitizen->street->name;
                $localCitizen->community_name = $localCitizen->street->community->name ?? null;
                $localCitizen->municipality_name = $localCitizen->street->community->municipality->name ?? null;
            }

            return response()->json([
                'source' => 'local',
                'found' => true,
                'citizen' => $localCitizen,
                'active_case' => $localCitizen->cases()
                    ->whereIn('status', ['open', 'in_progress'])
                    ->with('category')
                    ->first(),
            ]);
        }

        // 2. Not found locally - query external API
        $lookupService = new \App\Services\PersonLookupService();
        $externalData = $lookupService->lookup($cedula);

        if (!$externalData || !$externalData['found']) {
            return response()->json([
                'source' => 'none',
                'found' => false,
                'message' => 'Persona no encontrada en registros locales ni externos'
            ], 404);
        }

        // Return external data (pre-populated for form)
        return response()->json([
            'source' => 'external',
            'found' => true,
            'citizen' => $externalData,
            'message' => 'Datos obtenidos de sistema externo. Complete el registro.'
        ]);
    }
}