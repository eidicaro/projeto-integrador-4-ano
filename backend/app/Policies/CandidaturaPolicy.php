<?php

namespace App\Policies;

use App\Models\Candidatura;
use App\Models\User;

class CandidaturaPolicy
{
    public function view(User $user, Candidatura $candidatura): bool
    {
        return ($user->isCandidate() && $candidatura->user_id === $user->id)
            || ($user->isRecruiter() && $candidatura->vaga?->created_by === $user->id);
    }

    public function update(User $user, Candidatura $candidatura): bool
    {
        return $user->isRecruiter() && $candidatura->vaga?->created_by === $user->id;
    }

    public function delete(User $user, Candidatura $candidatura): bool
    {
        return $this->update($user, $candidatura);
    }
}
