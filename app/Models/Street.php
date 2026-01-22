<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Community;

class Street extends Model
{
    protected $fillable = ['community_id', 'name', 'code'];
    
    public function community() {
        return $this->belongsTo(Community::class); 
    }
}
