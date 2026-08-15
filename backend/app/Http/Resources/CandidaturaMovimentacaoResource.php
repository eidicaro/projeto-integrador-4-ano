<?php

namespace App\Http\Resources;

use App\Enums\CandidaturaStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidaturaMovimentacaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'previousStage' => $this->status_anterior instanceof CandidaturaStatus
                ? $this->status_anterior->value
                : $this->status_anterior,
            'stage' => $this->status_novo instanceof CandidaturaStatus
                ? $this->status_novo->value
                : $this->status_novo,
            'observation' => $this->observacao,
            'changedBy' => new UserResource($this->whenLoaded('user')),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
