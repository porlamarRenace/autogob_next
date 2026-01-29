<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PersonLookupService
{
    protected string $apiUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->apiUrl = config('services.person_lookup.url', 'https://psuvne.org/app_cruce_informacion/endPoint_persona.php');
        $this->apiKey = config('services.person_lookup.key', 'key');
    }

    /**
     * Lookup person by cedula from external API
     * 
     * @param string $cedula
     * @return array|null
     */
    public function lookup(string $cedula): ?array
    {
        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
            ])->asForm()->post($this->apiUrl, [
                'cedula' => $cedula
            ]);

            if (!$response->successful()) {
                Log::warning("PersonLookupService: API request failed", [
                    'cedula' => $cedula,
                    'status' => $response->status()
                ]);
                return null;
            }

            $data = $response->json();
            
            if (!isset($data['persona'])) {
                return null;
            }

            // Transform the response to our internal format
            return $this->transformResponse($data);

        } catch (\Exception $e) {
            Log::error("PersonLookupService: Exception", [
                'cedula' => $cedula,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Transform external API response to our internal format
     */
    protected function transformResponse(array $data): array
    {
        $persona = $data['persona'] ?? [];
        $perfil = $data['perfil_persona'] ?? [];

        // Parse birth date (format: dd/mm/yyyy)
        $birthDate = null;
        if (!empty($perfil['fecha_nacimiento'])) {
            try {
                $parts = explode('/', $perfil['fecha_nacimiento']);
                if (count($parts) === 3) {
                    $birthDate = "{$parts[2]}-{$parts[1]}-{$parts[0]}"; // Convert to Y-m-d
                }
            } catch (\Exception $e) {
                // Leave as null if parsing fails
            }
        }

        // Build full name
        $firstName = trim(($persona['nombre1'] ?? '') . ' ' . ($persona['nombre2'] ?? ''));
        $lastName = trim(($persona['apellido1'] ?? '') . ' ' . ($persona['apellido2'] ?? ''));

        return [
            'found' => true,
            'identification_value' => $persona['cedula'] ?? null,
            'nationality' => $perfil['otros']['nacionalidad'] ?? 'V',
            'first_name' => $firstName ?: null,
            'last_name' => $lastName ?: null,
            'birth_date' => $birthDate,
            'gender' => $this->mapGender($perfil['sexo'] ?? null),
            'phone' => $persona['telefono1'] ?? $persona['telefono2'] ?? null,
            'civil_status' => $perfil['otros']['estado_civil'] ?? null,
            'education_level' => $perfil['grado_instruccion'] ?? null,
            'profession' => $perfil['profesion'] ?? null,
            // Family data
            'family_status' => $persona['st_familiar'] ?? null,
            'registered_dependents' => $persona['cargas_registradas'] ?? null,
            'head_of_family_cedula' => $persona['cedula_jefe_familia'] ?? null,
            // Raw data for reference
            '_raw' => $data
        ];
    }

    /**
     * Map gender from external format to DB format (M/F)
     */
    protected function mapGender(?string $gender): ?string
    {
        if (!$gender) return null;
        
        // DB uses M/F enum, external API also uses M/F
        return match(strtoupper($gender)) {
            'M' => 'M',
            'F' => 'F',
            default => null
        };
    }
}
