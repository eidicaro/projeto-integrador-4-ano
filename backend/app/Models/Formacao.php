<?php

namespace App\Models;

use App\Enums\FormacaoTipo;
use Illuminate\Database\Eloquent\Model;

class Formacao extends Model
{
    protected $table = 'formacoes';

    protected $fillable = [
        'tipo',
        'curso',
        'instituicao',
        'periodo',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => FormacaoTipo::class,
        ];
    }

    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}
