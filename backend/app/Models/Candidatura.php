<?php

namespace App\Models;

use App\Enums\CandidaturaStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Candidatura extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'vaga_id',
        'curriculo_id',
        'curriculo_snapshot',
        'nome_candidato',
        'email_candidato',
        'telefone_candidato',
        'localizacao_candidato',
        'experiencia_resumo',
        'habilidades',
        'status',
        'observacoes',
        'avaliacao',
        'origem',
        'atualizada_por',
        'status_atualizado_em',
    ];

    protected function casts(): array
    {
        return [
            'habilidades' => 'array',
            'curriculo_snapshot' => 'array',
            'status' => CandidaturaStatus::class,
            'avaliacao' => 'integer',
            'status_atualizado_em' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vaga(): BelongsTo
    {
        return $this->belongsTo(Vaga::class)->withTrashed();
    }

    public function curriculo(): BelongsTo
    {
        return $this->belongsTo(Curriculo::class);
    }

    public function atualizadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'atualizada_por');
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(CandidaturaMovimentacao::class)->latest('created_at');
    }
}
