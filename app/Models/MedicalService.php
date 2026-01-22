<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalService extends Model
{
    use HasFactory;

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