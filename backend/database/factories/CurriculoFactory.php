<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CurriculoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->candidate(),
            'nome_completo' => fake()->name(),
            'area_atuacao' => fake()->randomElement(['Tecnologia', 'Design', 'Marketing']),
            'telefone' => fake()->numerify('(11) 9####-####'),
            'email' => fake()->safeEmail(),
            'cidade_estado' => fake()->city().' - SP',
            'links' => ['https://www.linkedin.com'],
            'resumo' => fake()->paragraph(),
        ];
    }
}
