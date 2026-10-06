<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TalentPoolMembership extends Model
{
    public const CONSENT_VERSION = 'v1';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'interests' => 'array', 'active' => 'boolean',
            'joined_at' => 'datetime', 'interests_updated_at' => 'datetime',
            'left_at' => 'datetime', 'consent_accepted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('active', true)->whereHas('user', fn (Builder $users) => $users
            ->where('ativo', true)->where('role', 'candidato'));
    }
}
