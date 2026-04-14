<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    protected $table = 'cursos';
    protected $fillable = [
        'curriculo_id',
        'nome',
        'instituicao',
        'periodo'
    ];
    
    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
