<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Formacao extends Model
{
    protected $table = 'formacoes';

    protected $fillable = [
        'curso',
        'instituicao',
        'periodo',
    ];

    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
