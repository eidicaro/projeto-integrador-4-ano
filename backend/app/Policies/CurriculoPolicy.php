<?php

namespace App\Policies;

use App\Models\Curriculo;
use App\Models\TalentPoolMembership;
use App\Models\User;

class CurriculoPolicy
{
    public function view(User $user, Curriculo $curriculo): bool
    {
        if ($user->isCandidate()) {
            return $curriculo->user_id === $user->id;
        }

        if (! $user->isRecruiter()) {
            return false;
        }

        if ($user->ativo && TalentPoolMembership::available()->where('user_id', $curriculo->user_id)->exists()) {
            return true;
        }

        return $curriculo->candidaturas()
            ->whereHas('vaga', fn ($query) => $query->where('created_by', $user->id))
            ->exists();
    }

    public function update(User $user, Curriculo $curriculo): bool
    {
        return $user->isCandidate() && $curriculo->user_id === $user->id;
    }

    public function delete(User $user, Curriculo $curriculo): bool
    {
        return $this->update($user, $curriculo);
    }
}
