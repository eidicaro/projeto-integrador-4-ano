<?php

namespace App\Models;

use App\Enums\CandidaturaStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidaturaMovimentacao extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'candidatura_movimentacoes';

    protected $fillable = [
        'candidatura_id',
        'user_id',
        'status_anterior',
        'status_novo',
        'observacao',
    ];

    protected function casts(): array
    {
        return [
            'status_anterior' => CandidaturaStatus::class,
            'status_novo' => CandidaturaStatus::class,
            'created_at' => 'datetime',
        ];
    }

    public function candidatura(): BelongsTo
    {
        return $this->belongsTo(Candidatura::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
