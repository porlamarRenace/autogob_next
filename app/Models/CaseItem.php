<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\SocialCase;
use App\Models\User;

class CaseItem extends Model
{
    use HasFactory;

    protected $table = 'case_items';

    protected $fillable = [
        'social_case_id',
        'itemable_id',
        'itemable_type',
        'quantity',
        'approved_quantity',
        'status',
        'description',
        'reviewed_by',
        'review_note',
        'fulfilled_at',
        'fulfilled_by'
    ];

    protected $casts = [
        'fulfilled_at' => 'datetime',
    ];

    public function socialCase()
    {
        return $this->belongsTo(SocialCase::class, 'social_case_id');
    }

    public function itemable()
    {
        return $this->morphTo();
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function fulfilledBy()
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }
}