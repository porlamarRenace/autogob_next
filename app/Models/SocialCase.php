<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SocialCase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'case_number',
        'citizen_id',
        'user_id',
        'assigned_to',
        'category_id',
        'subcategory_id',
        'channel',
        'description',
        'status',
    ];

    public function citizen() 
    {
        return $this->belongsTo(Citizen::class); 
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