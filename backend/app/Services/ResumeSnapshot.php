<?php

namespace App\Services;

use App\Models\Curriculo;

/** Shared snapshot format for voluntary applications and recruiter referrals. */
class ResumeSnapshot
{
    public function make(Curriculo $curriculo): array
    {
        return [
            'nome_completo' => $curriculo->nome_completo,
            'area_atuacao' => $curriculo->area_atuacao,
            'telefone' => $curriculo->telefone,
            'email' => $curriculo->email,
            'cidade_estado' => $curriculo->cidade_estado,
            'links' => $curriculo->links ?? [],
            'resumo' => $curriculo->resumo,
            'experiencias' => $curriculo->experiencias->toArray(),
            'formacoes' => $curriculo->formacoes->toArray(),
            'cursos' => $curriculo->cursos->toArray(),
            'habilidades' => $curriculo->habilidades->toArray(),
            'idiomas' => $curriculo->idiomas->toArray(),
        ];
    }
}
