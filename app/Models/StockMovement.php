<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class StockMovement extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'supply_id',
        'type',
        'quantity',
        'reason',
        'reference_type',
        'reference_id',
        'notes',
        'user_id',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['supply_id', 'type', 'quantity', 'reason'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn(string $eventName) => "Movimiento de stock {$eventName}");
    }

    // Relaciones
    public function supply()
    {
        return $this->belongsTo(Supply::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    // Scopes
    public function scopeEntries($query)
    {
        return $query->where('type', 'entry');
    }

    public function scopeExits($query)
    {
        return $query->where('type', 'exit');
    }

    // Helpers
    public function getReasonLabelAttribute(): string
    {
        return match($this->reason) {
            'purchase' => 'Compra',
            'donation' => 'Donación',
            'delivery' => 'Entrega a Caso',
            'adjustment' => 'Ajuste de Inventario',
            'loss' => 'Merma/Pérdida',
            'return' => 'Devolución',
            default => ucfirst($this->reason),
        };
    }
}
