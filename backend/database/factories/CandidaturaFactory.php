<?php

namespace Database\Factories;

use App\Enums\CandidaturaStatus;
use App\Models\Curriculo;
use App\Models\User;
use App\Models\Vaga;
use Illuminate\Database\Eloquent\Factories\Factory;

class CandidaturaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->candidate(),
            'vaga_id' => Vaga::factory(),
            'curriculo_id' => Curriculo::factory(),
            'nome_candidato' => fake()->name(),
            'email_candidato' => fake()->unique()->safeEmail(),
            'telefone_candidato' => fake()->numerify('(11) 9####-####'),
            'localizacao_candidato' => fake()->city().' - SP',
            'habilidades' => ['Comunicação', 'Git'],
            'status' => CandidaturaStatus::New,
            'origem' => 'plataforma',
            'status_atualizado_em' => now(),
        ];
    }
}
