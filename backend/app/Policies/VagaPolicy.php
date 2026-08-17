<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vaga;

class VagaPolicy
{
    public function create(User $user): bool
    {
        return $user->ativo && $user->isRecruiter();
    }

    public function update(User $user, Vaga $vaga): bool
    {
        return $user->ativo && $user->isRecruiter() && $vaga->created_by === $user->id;
    }

    public function delete(User $user, Vaga $vaga): bool
    {
        return $this->update($user, $vaga);
    }

    public function viewCandidates(User $user, Vaga $vaga): bool
    {
        return $this->update($user, $vaga);
    }
}
