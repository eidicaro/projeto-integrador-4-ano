<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Experiencia extends Model
{
    protected $table = 'experiencias';
    protected $fillable = [
        'curriculo_id',
        'cargo',
        'empresa',
        'periodo',
        'descricao'
    ];
    
    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
