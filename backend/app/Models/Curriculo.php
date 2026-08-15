<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curriculo extends Model
{
    use HasFactory;

    protected $fillable = [
        'nome_completo',
        'area_atuacao',
        'telefone',
        'email',
        'cidade_estado',
        'links',
        'resumo',
        'foto',
    ];

    protected function casts(): array
    {
        return [
            'links' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function experiencias(): HasMany
    {
        return $this->hasMany(Experiencia::class);
    }

    public function formacoes(): HasMany
    {
        return $this->hasMany(Formacao::class);
    }

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class);
    }

    public function habilidades(): HasMany
    {
        return $this->hasMany(Habilidade::class);
    }

    public function idiomas(): HasMany
    {
        return $this->hasMany(Idioma::class);
    }

    public function candidaturas(): HasMany
    {
        return $this->hasMany(Candidatura::class);
    }
}
