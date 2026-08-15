<?php

namespace App\Models;

use App\Enums\VagaStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vaga extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'titulo',
        'slug',
        'empresa',
        'departamento',
        'localizacao',
        'tipo_contratacao',
        'modalidade',
        'senioridade',
        'quantidade_vagas',
        'email_candidatura',
        'data_limite',
        'salario_min',
        'salario_max',
        'salario_visivel',
        'descricao',
        'responsabilidades',
        'requisitos',
        'tags',
        'beneficios',
        'imagem',
        'status',
        'publicada_em',
    ];

    protected function casts(): array
    {
        return [
            'data_limite' => 'date',
            'salario_min' => 'decimal:2',
            'salario_max' => 'decimal:2',
            'salario_visivel' => 'boolean',
            'tags' => 'array',
            'beneficios' => 'array',
            'status' => VagaStatus::class,
            'publicada_em' => 'datetime',
        ];
    }

    public function recrutador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function candidaturas(): HasMany
    {
        return $this->hasMany(Candidatura::class);
    }

    public function usuariosQueSalvaram(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'vagas_salvas')->withTimestamps();
    }

    public function scopeAbertas(Builder $query): Builder
    {
        return $query
            ->where('status', VagaStatus::Published->value)
            ->where(fn (Builder $builder) => $builder
                ->whereNull('data_limite')
                ->orWhereDate('data_limite', '>=', today()));
    }

    public function isOpenForApplications(): bool
    {
        return $this->status === VagaStatus::Published
            && ($this->data_limite === null || $this->data_limite->isToday() || $this->data_limite->isFuture());
    }
}
