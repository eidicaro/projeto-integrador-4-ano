<?php

namespace Tests;

use App\Enums\CandidaturaStatus;
use App\Enums\FormacaoTipo;
use App\Enums\VagaStatus;
use App\Models\Candidatura;
use App\Models\Curriculo;
use App\Models\User;
use App\Models\Vaga;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function candidate(array $attributes = []): User
    {
        return User::factory()->candidate()->create($attributes);
    }

    protected function recruiter(array $attributes = []): User
    {
        return User::factory()->recruiter()->create($attributes);
    }

    protected function vaga(User $recruiter, array $attributes = []): Vaga
    {
        return Vaga::factory()->create([
            'created_by' => $recruiter->id,
            ...$attributes,
        ]);
    }

    protected function curriculo(User $candidate, array $attributes = []): Curriculo
    {
        return Curriculo::factory()->create([
            'user_id' => $candidate->id,
            ...$attributes,
        ]);
    }

    protected function candidatura(
        User $candidate,
        Curriculo $curriculo,
        Vaga $vaga,
        array $attributes = [],
    ): Candidatura {
        return Candidatura::factory()->create([
            'user_id' => $candidate->id,
            'curriculo_id' => $curriculo->id,
            'vaga_id' => $vaga->id,
            'nome_candidato' => $curriculo->nome_completo,
            'email_candidato' => $curriculo->email,
            'telefone_candidato' => $curriculo->telefone,
            'localizacao_candidato' => $curriculo->cidade_estado,
            'status' => CandidaturaStatus::New,
            ...$attributes,
        ]);
    }

    /**
     * Payload in the exact camelCase shape produced by AdminCreate.jsx.
     *
     * @return array<string, mixed>
     */
    protected function vagaPayload(array $overrides = []): array
    {
        return array_replace([
            'title' => 'Desenvolvedor Laravel Pleno',
            'company' => 'Point Media',
            'department' => 'Tecnologia',
            'location' => 'Tatuí - SP',
            'employmentType' => 'CLT',
            'workMode' => 'Híbrido',
            'seniority' => 'Pleno',
            'openings' => 2,
            'applicationEmail' => 'talentos@pointmedia.com.br',
            'applicationDeadline' => now()->addMonth()->toDateString(),
            'salaryMin' => 6500,
            'salaryMax' => 9000,
            'salaryVisible' => true,
            'description' => trim(str_repeat('Descrição completa da oportunidade e do ambiente de trabalho. ', 3)),
            'responsibilities' => 'Desenvolver APIs, revisar código e colaborar com produto e design.',
            'requirements' => 'Experiência com Laravel, APIs REST, bancos relacionais e testes automatizados.',
            'tags' => ['Laravel', 'PHP', 'MySQL', 'Git'],
            'benefits' => ['vale-refeicao', 'plano-saude', 'horario-flexivel'],
            'image' => 'https://example.com/jobs/laravel.webp',
            'status' => VagaStatus::Published->value,
        ], $overrides);
    }

    /**
     * @return array<string, mixed>
     */
    protected function curriculoPayload(array $overrides = []): array
    {
        return array_replace([
            'nome_completo' => 'Maria da Silva',
            'area_atuacao' => 'Desenvolvimento de software',
            'telefone' => '(15) 99999-1111',
            'email' => 'maria@example.com',
            'cidade_estado' => 'Tatuí - SP',
            'links' => ['https://www.linkedin.com/in/maria', 'https://github.com/maria'],
            'resumo' => 'Profissional com experiência em desenvolvimento de aplicações web.',
            'experiencias' => [[
                'cargo' => 'Desenvolvedora',
                'empresa' => 'Empresa Exemplo',
                'periodo' => '2023 - atual',
                'descricao' => 'Desenvolvimento e manutenção de aplicações web.',
            ]],
            'formacoes' => [[
                'tipo' => FormacaoTipo::Technologist->value,
                'curso' => 'Análise e Desenvolvimento de Sistemas',
                'instituicao' => 'Fatec',
                'periodo' => '2022 - 2025',
            ]],
            'cursos' => [[
                'nome' => 'Laravel Avançado',
                'instituicao' => 'Escola de Tecnologia',
                'periodo' => '2025',
            ]],
            'habilidades' => [['nome' => 'Laravel'], ['nome' => 'MySQL']],
            'idiomas' => [['idioma' => 'Inglês', 'nivel' => 'Intermediário']],
        ], $overrides);
    }
}
