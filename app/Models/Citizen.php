<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SocialCase;
use App\Models\Street;
use App\Models\HealthProfile;

class Citizen extends Model
{
    use HasFactory;

    protected $fillable = [
        'nationality',
        'identification_value',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'phone',
        'email',
        'street_id',
        'reference_point',
        'latitude',
        'longitude',
        'social_data'
    ];

    protected $casts = [
        'birth_date' => 'date',
        'social_data' => 'array',
    ];

    public function street()
    {
        return $this->belongsTo(Street::class);
    }
    public function cases()
    {
        return $this->hasMany(SocialCase::class);
    }
    public function healthProfile()
    {
        return $this->hasOne(HealthProfile::class);
    }
}