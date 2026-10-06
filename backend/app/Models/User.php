<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'telefone',
        'foto',
        'password',
        'role',
        'ativo',
        'termos_aceitos_em',
        'ultimo_login_em',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'ativo' => 'boolean',
            'termos_aceitos_em' => 'datetime',
            'ultimo_login_em' => 'datetime',
        ];
    }

    public function talentPoolMembership(): HasOne
    {
        return $this->hasOne(TalentPoolMembership::class);
    }

    public function curriculo(): HasOne
    {
        return $this->hasOne(Curriculo::class);
    }

    public function candidaturas(): HasMany
    {
        return $this->hasMany(Candidatura::class);
    }

    public function vagasSalvas(): BelongsToMany
    {
        return $this->belongsToMany(Vaga::class, 'vagas_salvas')->withTimestamps();
    }

    public function vagasCriadas(): HasMany
    {
        return $this->hasMany(Vaga::class, 'created_by');
    }

    public function isCandidate(): bool
    {
        return $this->role === UserRole::Candidate;
    }

    public function isRecruiter(): bool
    {
        return $this->role === UserRole::Recruiter;
    }
}
