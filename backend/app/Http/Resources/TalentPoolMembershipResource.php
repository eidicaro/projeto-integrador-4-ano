<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TalentPoolMembershipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'interests' => $this->interests,
            'joinedAt' => $this->joined_at->toISOString(),
            'updatedAt' => $this->interests_updated_at->toISOString(),
        ];
    }
}
