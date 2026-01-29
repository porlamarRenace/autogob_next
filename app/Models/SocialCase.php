<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class SocialCase extends Model implements HasMedia
{
    use HasFactory, SoftDeletes, InteractsWithMedia, LogsActivity;

    /**
     * Activity log configuration
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'assigned_to', 'category_id', 'subcategory_id', 'description'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Caso {$this->case_number} {$eventName}");
    }

    protected $fillable = [
        'case_number',
        'citizen_id',
        'applicant_id',
        'beneficiary_id',
        'user_id',
        'assigned_to',
        'category_id',
        'subcategory_id',
        'channel',
        'description',
        'status',
    ];

    /**
     * Register media collections for case attachments (multiple files)
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attachments')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
    }

    /**
     * Register media conversions (thumbnail for images)
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(200)
            ->height(200);
    }

    /**
     * Ciudadano principal (compatibilidad legacy)
     */
    public function citizen() 
    {
        return $this->belongsTo(Citizen::class); 
    }

    /**
     * Solicitante: persona que realiza la solicitud
     */
    public function applicant()
    {
        return $this->belongsTo(Citizen::class, 'applicant_id');
    }

    /**
     * Beneficiario: persona que recibe la ayuda
     */
    public function beneficiary()
    {
        return $this->belongsTo(Citizen::class, 'beneficiary_id');
    }

    public function creator() 
    { 
        return $this->belongsTo(User::class, 'user_id'); 
    }
    public function assignee() 
    {
        return $this->belongsTo(User::class, 'assigned_to'); 
    }
    public function category() 
    {
        return $this->belongsTo(Category::class, 'category_id'); 
    }
    public function subcategory() 
    {
        return $this->belongsTo(Category::class, 'subcategory_id'); 
    }

    public function items()
    {
        return $this->hasMany(CaseItem::class, 'social_case_id');
    }
    
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->case_number)) {
                $model->case_number = 'AYU-' . date('Y') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            }
        });
    }
}