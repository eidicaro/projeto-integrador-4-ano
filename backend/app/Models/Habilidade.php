<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Habilidade extends Model
{
    protected $table = 'habilidades';
    protected $fillable = [
        'curriculo_id',
        'nome'
    ];
    
    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
