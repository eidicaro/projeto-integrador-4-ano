<?php

namespace App\Http\Resources;

use App\Enums\VagaStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VagaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->titulo,
            'company' => $this->empresa,
            'department' => $this->departamento,
            'location' => $this->localizacao,
            'employmentType' => $this->tipo_contratacao,
            'workMode' => $this->modalidade,
            'seniority' => $this->senioridade,
            'openings' => $this->quantidade_vagas,
            'applicationEmail' => $this->email_candidatura,
            'applicationDeadline' => $this->data_limite?->format('Y-m-d'),
            'salaryMin' => $this->salario_min !== null ? (float) $this->salario_min : null,
            'salaryMax' => $this->salario_max !== null ? (float) $this->salario_max : null,
            'salaryVisible' => (bool) $this->salario_visivel,
            'description' => $this->descricao,
            'responsibilities' => $this->responsabilidades,
            'requirements' => $this->requisitos,
            'tags' => $this->tags ?? [],
            'benefits' => $this->beneficios ?? [],
            'image' => $this->imagem,
            'status' => $this->status instanceof VagaStatus ? $this->status->value : $this->status,
            'isOpen' => $this->isOpenForApplications(),
            'applicantsCount' => $this->whenCounted('candidaturas'),
            'createdBy' => new UserResource($this->whenLoaded('recrutador')),
            'publishedAt' => $this->publicada_em?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
