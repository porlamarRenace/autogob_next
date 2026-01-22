<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Community;
use App\Models\State;

class Municipality extends Model
{
    protected $fillable = ['state_id', 'name'];

    public function communities() 
    { 
        return $this->hasMany(Community::class); 
    }

    public function state() 
    { 
        return $this->belongsTo(State::class); 
    }
}
