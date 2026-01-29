<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Supply extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'unit', 'concentration', 'status', 'category_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Insumo {$eventName}");
    }

    protected $fillable = [
        'category_id',
        'name',
        'unit',
        'concentration',
        'status'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}