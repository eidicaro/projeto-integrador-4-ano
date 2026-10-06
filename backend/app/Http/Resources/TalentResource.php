<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class TalentResource extends TalentPoolMembershipResource
{
    public function toArray(Request $request): array
    {
        $user = $this->user;
        $resume = $user->curriculo;
        $name = $resume?->nome_completo ?: $user->name;
        $email = $resume?->email ?: $user->email;
        $phone = $resume?->telefone ?: $user->telefone;
        $checks = [
            $name, $email, $phone, $resume?->cidade_estado,
            $resume?->area_atuacao, $resume?->resumo,
            $resume?->habilidades->count(),
            $resume?->experiencias->count() ?: $resume?->formacoes->count(),
        ];

        return parent::toArray($request) + [
            'name' => $name, 'email' => $email, 'phone' => $phone,
            'location' => $resume?->cidade_estado,
            'skills' => $resume?->habilidades->pluck('nome')->values()->all() ?? [],
            'profileCompleteness' => (int) round(count(array_filter($checks)) / 8 * 100),
            'resume' => $resume ? new CurriculoResource($resume) : null,
        ];
    }
}
