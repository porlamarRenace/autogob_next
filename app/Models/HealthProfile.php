<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Citizen;

class HealthProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'citizen_id',
        
        // Generales
        'has_diabetes',
        'has_hypertension',
        'has_cancer',
        'has_allergies',
        'has_alcoholism',
        'has_drugs',
        'was_operated',

        // Específicas
        'has_mental_condition',
        'has_eye_condition',
        'has_dental_condition',
        'has_hereditary_condition',
        'has_kidney_condition',
        'has_liver_condition',
        'has_heart_condition',
        'has_gastro_condition',
        'has_skin_condition',

        // Discapacidad y Datos
        'is_disabled',
        'disability_type',
        'blood_type',
        'weight',
        'height',
        'notes'
    ];

    // Aseguramos que PHP/Laravel trate estos campos como true/false y no como 0/1
    protected $casts = [
        'has_diabetes' => 'boolean',
        'has_hypertension' => 'boolean',
        'has_cancer' => 'boolean',
        'has_allergies' => 'boolean',
        'has_alcoholism' => 'boolean',
        'has_drugs' => 'boolean',
        'was_operated' => 'boolean',
        'has_mental_condition' => 'boolean',
        'has_eye_condition' => 'boolean',
        'has_dental_condition' => 'boolean',
        'has_hereditary_condition' => 'boolean',
        'has_kidney_condition' => 'boolean',
        'has_liver_condition' => 'boolean',
        'has_heart_condition' => 'boolean',
        'has_gastro_condition' => 'boolean',
        'has_skin_condition' => 'boolean',
        'is_disabled' => 'boolean',
        'weight' => 'decimal:2',
        'height' => 'decimal:2',
    ];

    /**
     * Relación inversa: Un perfil de salud pertenece a un Ciudadano.
     */
    public function citizen()
    {
        return $this->belongsTo(Citizen::class);
    }
}