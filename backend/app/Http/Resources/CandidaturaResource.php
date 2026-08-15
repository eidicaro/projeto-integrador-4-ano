<?php

namespace App\Http\Resources;

use App\Enums\CandidaturaStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidaturaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewRecruiterFields = $request->user()?->isRecruiter() === true;

        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'jobId' => $this->vaga_id,
            'resumeId' => $this->curriculo_id,
            'resumeSnapshot' => $this->curriculo_snapshot,
            'name' => $this->nome_candidato,
            'email' => $this->email_candidato,
            'phone' => $this->telefone_candidato,
            'location' => $this->localizacao_candidato,
            'experience' => $this->experiencia_resumo,
            'skills' => $this->habilidades ?? [],
            'stage' => $this->status instanceof CandidaturaStatus ? $this->status->value : $this->status,
            'rating' => $this->when($canViewRecruiterFields, $this->avaliacao ?? 0),
            'notes' => $this->when($canViewRecruiterFields, $this->observacoes),
            'source' => $this->origem,
            'job' => new VagaResource($this->whenLoaded('vaga')),
            'resume' => new CurriculoResource($this->whenLoaded('curriculo')),
            'user' => new UserResource($this->whenLoaded('user')),
            'appliedAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
            'statusUpdatedAt' => $this->status_atualizado_em?->toISOString(),
        ];
    }
}
