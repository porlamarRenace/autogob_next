<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseItem extends Model
{
    use HasFactory;

    protected $table = 'case_items';

    protected $fillable = [
        'case_id',
        'itemable_id',   // ID del Insumo o Servicio
        'itemable_type', // App\Models\Supply o App\Models\MedicalService
        'quantity',      // Cantidad solicitada
        'approved_quantity', // Cantidad aprobada por gerencia
        'status',        // pending, approved, rejected
        'reviewed_by',   // ID del gerente que revisó
        'review_note'    // Motivo de rechazo o ajuste
    ];

    // Relación inversa con el Caso
    public function socialCase()
    {
        return $this->belongsTo(SocialCase::class, 'case_id');
    }

    /**
     * Relación Polimórfica Mágica.
     * Esto devolverá una instancia de Supply o MedicalService
     * dependiendo de lo que se haya guardado en 'itemable_type'.
     */
    public function itemable()
    {
        return $this->morphTo();
    }

    // Relación con el usuario que aprobó/rechazó
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}