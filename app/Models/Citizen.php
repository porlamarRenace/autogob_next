<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SocialCase;
use App\Models\Street;
use App\Models\HealthProfile;
use Carbon\Carbon;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Citizen extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity;

    /**
     * Activity log configuration
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['first_name', 'last_name', 'identification_value', 'nationality', 'phone', 'street_id', 'birth_date', 'gender'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Ciudadano {$eventName}");
    }

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
        'social_data',
        'photo',
        'representative_id'
    ];

    protected $casts = [
        'birth_date' => 'date',
        'social_data' => 'array',
    ];

    protected $appends = ['is_minor', 'age', 'full_name', 'photo_url'];

    /**
     * Register media collections for citizen photo
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('photo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/jpg']);
    }

    /**
     * Register media conversions (thumbnail)
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(150)
            ->height(150)
            ->sharpen(10);
    }

    /**
     * Get photo URL attribute
     */
    public function getPhotoUrlAttribute(): ?string
    {
        $media = $this->getFirstMedia('photo');
        return $media ? $media->getUrl() : null;
    }

    /**
     * Check if citizen is a minor (under 18)
     */
    public function getIsMinorAttribute(): bool
    {
        if (!$this->birth_date) {
            return false;
        }
        return $this->birth_date->diffInYears(Carbon::now()) < 18;
    }

    /**
     * Get citizen's age in years
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->birth_date) {
            return null;
        }
        return $this->birth_date->diffInYears(Carbon::now());
    }

    /**
     * Get full name
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Relationship: Citizen's street location
     */
    public function street()
    {
        return $this->belongsTo(Street::class);
    }

    /**
     * Relationship: Cases associated with this citizen (legacy)
     */
    public function cases()
    {
        return $this->hasMany(SocialCase::class);
    }

    /**
     * Relationship: Cases where this citizen is the applicant
     */
    public function applicantCases()
    {
        return $this->hasMany(SocialCase::class, 'applicant_id');
    }

    /**
     * Relationship: Cases where this citizen is the beneficiary
     */
    public function beneficiaryCases()
    {
        return $this->hasMany(SocialCase::class, 'beneficiary_id');
    }

    /**
     * Relationship: Health profile
     */
    public function healthProfile()
    {
        return $this->hasOne(HealthProfile::class);
    }

    /**
     * Relationship: Legal representative (for minors)
     */
    public function representative()
    {
        return $this->belongsTo(Citizen::class, 'representative_id');
    }

    /**
     * Relationship: Minors under this citizen's care
     */
    public function minors()
    {
        return $this->hasMany(Citizen::class, 'representative_id');
    }
}