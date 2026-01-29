<?php

namespace App\Services;

use App\Models\Citizen;

class ProfileValidationService
{
    /**
     * Validate that a citizen has a complete profile for case creation
     * 
     * @param Citizen $citizen
     * @return array Array of validation errors (empty if valid)
     */
    public function validateForCaseCreation(Citizen $citizen): array
    {
        $errors = [];

        // 1. Personal data validation
        if (empty($citizen->first_name)) {
            $errors[] = 'El nombre es obligatorio';
        }
        if (empty($citizen->last_name)) {
            $errors[] = 'El apellido es obligatorio';
        }
        if (empty($citizen->identification_value)) {
            $errors[] = 'El número de cédula es obligatorio';
        }
        if (empty($citizen->birth_date)) {
            $errors[] = 'La fecha de nacimiento es obligatoria';
        }
        if (empty($citizen->phone)) {
            $errors[] = 'El teléfono es obligatorio para poder contactarle';
        }

        // 2. Address validation
        if (empty($citizen->street_id)) {
            $errors[] = 'Debe seleccionar una dirección (calle) para poder ubicarle';
        }

        // 3. Health profile validation
        $healthProfile = $citizen->healthProfile;
        if (!$healthProfile) {
            $errors[] = 'El perfil de salud no está registrado';
        } elseif (empty($healthProfile->notes)) {
            $errors[] = 'Las observaciones médicas son obligatorias en el perfil de salud';
        }

        // 4. Minor validation
        if ($citizen->is_minor && empty($citizen->representative_id)) {
            $errors[] = 'Los menores de edad deben tener un representante legal asignado';
        }

        return $errors;
    }

    /**
     * Check if citizen profile is complete for case creation
     * 
     * @param Citizen $citizen
     * @return bool
     */
    public function isProfileComplete(Citizen $citizen): bool
    {
        return empty($this->validateForCaseCreation($citizen));
    }

    /**
     * Get a summary of missing profile data
     * 
     * @param Citizen $citizen
     * @return array ['complete' => bool, 'errors' => array, 'missing_sections' => array]
     */
    public function getProfileStatus(Citizen $citizen): array
    {
        $errors = $this->validateForCaseCreation($citizen);
        
        $missingSections = [];
        
        // Determine which sections are incomplete
        if (empty($citizen->first_name) || empty($citizen->last_name) || empty($citizen->phone)) {
            $missingSections[] = 'Datos Personales';
        }
        if (empty($citizen->street_id)) {
            $missingSections[] = 'Dirección';
        }
        if (!$citizen->healthProfile || empty($citizen->healthProfile->notes)) {
            $missingSections[] = 'Perfil de Salud';
        }
        
        return [
            'complete' => empty($errors),
            'errors' => $errors,
            'missing_sections' => $missingSections
        ];
    }
}
