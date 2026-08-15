<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class CurriculoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $foto = $this->foto;
        if ($foto && ! Str::startsWith($foto, ['http://', 'https://'])) {
            $foto = url("/api/curriculos/{$this->id}/foto");
        }

        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'nome_completo' => $this->nome_completo,
            'area_atuacao' => $this->area_atuacao,
            'telefone' => $this->telefone,
            'email' => $this->email,
            'cidade_estado' => $this->cidade_estado,
            'links' => $this->links ?? [],
            'resumo' => $this->resumo,
            'foto' => $foto,
            'experiencias' => $this->whenLoaded('experiencias'),
            'formacoes' => $this->whenLoaded('formacoes'),
            'cursos' => $this->whenLoaded('cursos'),
            'habilidades' => $this->whenLoaded('habilidades'),
            'idiomas' => $this->whenLoaded('idiomas'),
            'user' => new UserResource($this->whenLoaded('user')),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
