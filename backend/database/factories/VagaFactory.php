<?php

namespace Database\Factories;

use App\Enums\VagaStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VagaFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->randomElement([
            'Desenvolvedor Front-end',
            'Desenvolvedor Back-end',
            'Product Designer',
            'Analista de Dados',
            'Social Media',
            'QA Engineer',
        ]).' '.fake()->unique()->numerify('##');

        return [
            'created_by' => User::factory()->recruiter(),
            'titulo' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numerify('####'),
            'empresa' => 'Point Media',
            'departamento' => fake()->randomElement(['Tecnologia', 'Produto', 'Marketing', 'Design']),
            'localizacao' => fake()->randomElement(['São Paulo - SP', 'Sorocaba - SP', 'Remoto - Brasil']),
            'tipo_contratacao' => fake()->randomElement(['CLT', 'PJ', 'Estágio']),
            'modalidade' => fake()->randomElement(['Presencial', 'Híbrido', 'Remoto']),
            'senioridade' => fake()->randomElement(['Júnior', 'Pleno', 'Sênior']),
            'quantidade_vagas' => fake()->numberBetween(1, 4),
            'email_candidatura' => 'talentos@pointmedia.com.br',
            'data_limite' => now()->addDays(fake()->numberBetween(15, 90))->toDateString(),
            'salario_min' => fake()->numberBetween(3000, 7000),
            'salario_max' => fake()->numberBetween(8000, 14000),
            'salario_visivel' => true,
            'descricao' => fake()->paragraphs(3, true),
            'responsabilidades' => fake()->paragraphs(2, true),
            'requisitos' => fake()->paragraphs(2, true),
            'tags' => fake()->randomElements(['React', 'Laravel', 'Figma', 'SQL', 'Git', 'Comunicação'], 4),
            'beneficios' => ['vale-refeicao', 'plano-saude', 'horario-flexivel'],
            'status' => VagaStatus::Published,
            'publicada_em' => now()->subDays(fake()->numberBetween(0, 10)),
        ];
    }

    public function paused(): static
    {
        return $this->state(fn () => ['status' => VagaStatus::Paused]);
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => VagaStatus::Archived]);
    }
}
