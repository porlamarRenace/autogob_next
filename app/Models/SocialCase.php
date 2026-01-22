<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialCase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'case_number',   // Ej: AYU-2026-001
        'citizen_id',
        'user_id',       // Operador que creó el caso
        'assigned_to',   // Especialista asignado
        'category_id',
        'subcategory_id',
        'channel',       // 1x10, Presencial, etc.
        'description',
        'status',        // open, in_progress, etc.
    ];

    // Relación: Un caso pertenece a un Ciudadano
    public function citizen()
    {
        return $this->belongsTo(Citizen::class);
    }

    // Relación: Un caso fue creado por un Usuario (Operador)
    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relación: Un caso está asignado a un Usuario (Especialista/Gerente)
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // Relación: Categoría principal (Ej: Salud)
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    // Relación: Subcategoría (Ej: Medicamentos)
    public function subcategory()
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    // Relación: Un caso tiene muchos ítems solicitados
    public function items()
    {
        return $this->hasMany(CaseItem::class, 'case_id');
    }
    
    // Boot: Generar número de caso automático al crear
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Ejemplo simple de correlativo: AYU-TIMESTAMP-RANDOM
            // Lo ideal es una secuencia en BD, pero esto funciona para empezar
            if (empty($model->case_number)) {
                $model->case_number = 'AYU-' . date('Y') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            }
        });
    }
}