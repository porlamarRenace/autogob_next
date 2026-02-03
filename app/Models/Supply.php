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
            ->logOnly(['name', 'unit', 'concentration', 'status', 'category_id', 'current_stock', 'min_stock'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Insumo {$eventName}");
    }

    protected $fillable = [
        'category_id',
        'name',
        'unit',
        'concentration',
        'status',
        'current_stock',
        'min_stock',
    ];

    protected $appends = ['is_low_stock'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // Helpers
    public function getIsLowStockAttribute(): bool
    {
        return $this->current_stock <= $this->min_stock;
    }

    public function addStock(int $quantity, string $reason, ?int $userId = null, ?string $notes = null, $reference = null): StockMovement
    {
        $this->increment('current_stock', $quantity);

        return $this->movements()->create([
            'type' => 'entry',
            'quantity' => $quantity,
            'reason' => $reason,
            'notes' => $notes,
            'user_id' => $userId ?? auth()->id(),
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id' => $reference?->id,
        ]);
    }

    public function removeStock(int $quantity, string $reason, ?int $userId = null, ?string $notes = null, $reference = null): StockMovement
    {
        $this->decrement('current_stock', $quantity);

        return $this->movements()->create([
            'type' => 'exit',
            'quantity' => $quantity,
            'reason' => $reason,
            'notes' => $notes,
            'user_id' => $userId ?? auth()->id(),
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id' => $reference?->id,
        ]);
    }
}