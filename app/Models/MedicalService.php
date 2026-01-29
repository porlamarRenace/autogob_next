<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class MedicalService extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'institution_id', 'specialties'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Servicio Médico {$eventName}");
    }

    protected $fillable = [
        'institution_id',
        'name',
        'specialties'
    ];

    protected $casts = [
        'specialties' => 'array',
    ];

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }
}