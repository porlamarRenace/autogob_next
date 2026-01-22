<?php

namespace App\Models;

use App\Models\Municipality;
use App\Models\Street;
use Illuminate\Database\Eloquent\Model;

class Community extends Model
{
    protected $fillable = ['municipality_id', 'name', 'code'];
    
    public function streets() 
    {
        return $this->hasMany(Street::class); 
    }
    
    public function municipality() 
    { 
        return $this->belongsTo(Municipality::class); 
    }
}
