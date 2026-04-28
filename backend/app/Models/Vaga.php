<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vaga extends Model
{
    protected $fillable = [
        'titulo',
        'descricao',
        'requisitos'
    ];
    public function candidaturas()
    {
        return $this->hasMany(Candidatura::class);
    }
}