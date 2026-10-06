<?php

namespace App\Policies;

use App\Models\TalentPoolMembership;
use App\Models\User;

class TalentPoolMembershipPolicy
{
    // Single-company application: every active recruiter may read the active pool.
    public function viewAny(User $user): bool
    {
        return $user->ativo && $user->isRecruiter();
    }

    public function view(User $user, TalentPoolMembership $talent): bool
    {
        $candidate = $talent->user;

        return $this->viewAny($user) && $talent->active
            && $candidate && $candidate->ativo && $candidate->isCandidate();
    }
}
