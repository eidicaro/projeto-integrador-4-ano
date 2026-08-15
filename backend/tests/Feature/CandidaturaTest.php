<?php

namespace Tests\Feature;

use App\Enums\CandidaturaStatus;
use App\Enums\VagaStatus;
use App\Models\Candidatura;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CandidaturaTest extends TestCase
{
    use RefreshDatabase;

    public function test_candidate_must_have_resume_before_applying(): void
    {
        $candidate = $this->candidate();
        $job = $this->vaga($this->recruiter());
        Sanctum::actingAs($candidate, ['candidate']);

        $this->postJson("/api/vagas/{$job->id}/candidaturas")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Crie seu currículo antes de se candidatar.');

        $this->assertDatabaseCount('candidaturas', 0);
    }

    public function test_candidate_cannot_apply_to_paused_archived_or_expired_job(): void
    {
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $owner = $this->recruiter();
        $jobs = [
            $this->vaga($owner, ['status' => VagaStatus::Paused]),
            $this->vaga($owner, ['status' => VagaStatus::Archived]),
            $this->vaga($owner, [
                'status' => VagaStatus::Published,
                'data_limite' => today()->subDay(),
            ]),
        ];
        Sanctum::actingAs($candidate, ['candidate']);

        foreach ($jobs as $job) {
            $this->postJson("/api/vagas/{$job->id}/candidaturas")
                ->assertConflict()
                ->assertJsonPath('message', 'Esta vaga não está recebendo candidaturas.');
        }

        $this->assertDatabaseCount('candidaturas', 0);
    }

    public function test_candidate_applies_to_open_job_and_contact_data_is_snapshotted(): void
    {
        $candidate = $this->candidate([
            'name' => 'Nome da Conta',
            'email' => 'conta@example.com',
            'telefone' => '15911112222',
        ]);
        $resume = $this->curriculo($candidate, [
            'nome_completo' => 'Nome do Currículo',
            'email' => 'curriculo@example.com',
            'telefone' => '(15) 99999-0000',
            'cidade_estado' => 'Tatuí - SP',
            'area_atuacao' => 'Desenvolvimento web',
        ]);
        $resume->habilidades()->createMany([['nome' => 'Laravel'], ['nome' => 'MySQL']]);
        $job = $this->vaga($this->recruiter());
        Sanctum::actingAs($candidate, ['candidate']);

        $response = $this->postJson("/api/vagas/{$job->id}/candidaturas", [
            'curriculo_id' => $resume->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.userId', $candidate->id)
            ->assertJsonPath('data.jobId', $job->id)
            ->assertJsonPath('data.resumeId', $resume->id)
            ->assertJsonPath('data.name', 'Nome do Currículo')
            ->assertJsonPath('data.email', 'curriculo@example.com')
            ->assertJsonPath('data.phone', '(15) 99999-0000')
            ->assertJsonPath('data.location', 'Tatuí - SP')
            ->assertJsonPath('data.experience', 'Desenvolvimento web')
            ->assertJsonPath('data.skills', ['Laravel', 'MySQL'])
            ->assertJsonPath('data.stage', CandidaturaStatus::New->value)
            ->assertJsonPath('data.source', 'plataforma');

        $this->assertDatabaseHas('candidaturas', [
            'user_id' => $candidate->id,
            'vaga_id' => $job->id,
            'curriculo_id' => $resume->id,
            'nome_candidato' => 'Nome do Currículo',
            'email_candidato' => 'curriculo@example.com',
            'status' => CandidaturaStatus::New->value,
            'origem' => 'plataforma',
        ]);
    }

    public function test_candidate_cannot_apply_twice_to_same_job(): void
    {
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $job = $this->vaga($this->recruiter());
        Sanctum::actingAs($candidate, ['candidate']);

        $this->postJson("/api/vagas/{$job->id}/candidaturas")->assertCreated();
        $this->postJson("/api/vagas/{$job->id}/candidaturas")
            ->assertConflict()
            ->assertJsonPath('message', 'Você já se candidatou para esta vaga.');

        $this->assertDatabaseCount('candidaturas', 1);
    }

    public function test_candidate_cannot_submit_another_users_resume_id(): void
    {
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $foreignResume = $this->curriculo($this->candidate());
        $job = $this->vaga($this->recruiter());
        Sanctum::actingAs($candidate, ['candidate']);

        $this->postJson("/api/vagas/{$job->id}/candidaturas", [
            'curriculo_id' => $foreignResume->id,
        ])->assertForbidden();

        $this->assertDatabaseCount('candidaturas', 0);
    }

    public function test_owner_can_add_manual_candidate_with_admin_see_fields(): void
    {
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner, ['recruiter']);

        $response = $this->postJson("/api/admin/vagas/{$job->id}/candidaturas/manual", [
            'name' => '  João da Silva ',
            'email' => ' JOAO@EXAMPLE.COM ',
            'phone' => '(15) 99999-1234',
            'location' => 'Sorocaba - SP',
            'experience' => '3 anos',
            'skills' => 'Laravel, PHP, MySQL',
            'notes' => 'Indicação interna.',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'João da Silva')
            ->assertJsonPath('data.email', 'joao@example.com')
            ->assertJsonPath('data.phone', '(15) 99999-1234')
            ->assertJsonPath('data.location', 'Sorocaba - SP')
            ->assertJsonPath('data.experience', '3 anos')
            ->assertJsonPath('data.skills', ['Laravel', 'PHP', 'MySQL'])
            ->assertJsonPath('data.notes', 'Indicação interna.')
            ->assertJsonPath('data.stage', CandidaturaStatus::New->value)
            ->assertJsonPath('data.rating', 0)
            ->assertJsonPath('data.source', 'manual');

        $this->assertDatabaseHas('candidaturas', [
            'vaga_id' => $job->id,
            'user_id' => null,
            'curriculo_id' => null,
            'email_candidato' => 'joao@example.com',
            'origem' => 'manual',
            'atualizada_por' => $owner->id,
        ]);
    }

    public function test_manual_candidate_email_is_unique_per_job_after_normalization(): void
    {
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner, ['recruiter']);

        $payload = ['name' => 'João da Silva', 'email' => 'joao@example.com'];
        $this->postJson("/api/admin/vagas/{$job->id}/candidaturas/manual", $payload)->assertCreated();
        $this->postJson("/api/admin/vagas/{$job->id}/candidaturas/manual", [
            ...$payload,
            'email' => ' JOAO@EXAMPLE.COM ',
        ])->assertConflict();

        $this->assertDatabaseCount('candidaturas', 1);
    }

    public function test_recruiter_cannot_view_add_update_or_delete_candidates_from_another_recruiters_job(): void
    {
        $owner = $this->recruiter();
        $intruder = $this->recruiter();
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $job = $this->vaga($owner);
        $application = $this->candidatura($candidate, $resume, $job);
        Sanctum::actingAs($intruder, ['recruiter']);

        $this->getJson("/api/admin/vagas/{$job->id}/candidaturas")->assertForbidden();
        $this->postJson("/api/admin/vagas/{$job->id}/candidaturas/manual", [
            'name' => 'Candidato Manual',
            'email' => 'manual@example.com',
            'skills' => [],
        ])->assertForbidden();
        $this->getJson("/api/admin/candidaturas/{$application->id}")->assertForbidden();
        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'stage' => CandidaturaStatus::Interview->value,
        ])->assertForbidden();
        $this->deleteJson("/api/admin/candidaturas/{$application->id}")->assertForbidden();

        $this->assertDatabaseHas('candidaturas', [
            'id' => $application->id,
            'status' => CandidaturaStatus::New->value,
            'deleted_at' => null,
        ]);
    }

    public function test_admin_application_index_rejects_an_unknown_status_filter(): void
    {
        Sanctum::actingAs($this->recruiter(), ['recruiter']);

        $this->getJson('/api/admin/candidaturas?status=status-inexistente')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_admin_pipeline_hides_applications_from_soft_deleted_jobs_but_preserves_history(): void
    {
        [$owner, $application] = $this->ownedApplication();
        $application->vaga()->firstOrFail()->delete();
        Sanctum::actingAs($owner, ['recruiter']);

        $this->getJson('/api/admin/candidaturas')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson("/api/admin/candidaturas/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $application->id);

        $this->assertDatabaseHas('candidaturas', [
            'id' => $application->id,
            'deleted_at' => null,
        ]);
    }

    public function test_stage_patch_preserves_existing_rating_and_notes(): void
    {
        [$owner, $application] = $this->ownedApplication([
            'status' => CandidaturaStatus::Screening,
            'avaliacao' => 4,
            'observacoes' => 'Boa comunicação.',
        ]);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'stage' => CandidaturaStatus::Interview->value,
        ])->assertOk()
            ->assertJsonPath('data.stage', CandidaturaStatus::Interview->value)
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.notes', 'Boa comunicação.');
    }

    public function test_rating_can_be_updated_independently_without_changing_stage_or_notes(): void
    {
        [$owner, $application] = $this->ownedApplication([
            'status' => CandidaturaStatus::Interview,
            'avaliacao' => 2,
            'observacoes' => 'Aguardando case.',
        ]);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'rating' => 5,
        ])->assertOk()
            ->assertJsonPath('data.stage', CandidaturaStatus::Interview->value)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.notes', 'Aguardando case.');
    }

    public function test_notes_can_be_updated_independently_without_changing_stage_or_rating(): void
    {
        [$owner, $application] = $this->ownedApplication([
            'status' => CandidaturaStatus::Offer,
            'avaliacao' => 5,
            'observacoes' => 'Nota antiga.',
        ]);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'notes' => 'Proposta enviada em 14/08.',
        ])->assertOk()
            ->assertJsonPath('data.stage', CandidaturaStatus::Offer->value)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.notes', 'Proposta enviada em 14/08.');
    }

    public function test_pipeline_rejects_invalid_stage_rating_and_candidate_cannot_use_admin_endpoint(): void
    {
        [$owner, $application] = $this->ownedApplication();
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'stage' => CandidaturaStatus::Withdrawn->value,
            'rating' => 6,
        ])->assertUnprocessable()->assertJsonValidationErrors(['status', 'avaliacao']);

        Sanctum::actingAs($application->user()->firstOrFail(), ['candidate']);
        $this->patchJson("/api/admin/candidaturas/{$application->id}", [
            'stage' => CandidaturaStatus::Hired->value,
        ])->assertForbidden();
    }

    public function test_candidate_can_withdraw_own_application_but_not_another_users_application(): void
    {
        $owner = $this->recruiter();
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $application = $this->candidatura($candidate, $resume, $this->vaga($owner));
        $intruder = $this->candidate();
        Sanctum::actingAs($intruder, ['candidate']);

        $this->patchJson("/api/candidaturas/{$application->id}/retirar")->assertForbidden();

        Sanctum::actingAs($candidate, ['candidate']);
        $this->patchJson("/api/candidaturas/{$application->id}/retirar")
            ->assertOk()
            ->assertJsonPath('data.stage', CandidaturaStatus::Withdrawn->value);

        $this->assertSame(CandidaturaStatus::Withdrawn, $application->fresh()->status);
        $this->assertSame(1, $application->movimentacoes()->count());

        $this->patchJson("/api/candidaturas/{$application->id}/retirar")
            ->assertConflict();

        $this->assertSame(1, $application->movimentacoes()->count());
        $this->getJson("/api/candidaturas/{$application->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $application->id);
    }

    public function test_pipeline_stage_changes_are_audited_and_history_respects_application_visibility(): void
    {
        $owner = $this->recruiter();
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $job = $this->vaga($owner);
        Sanctum::actingAs($candidate, ['candidate']);

        $created = $this->postJson("/api/vagas/{$job->id}/candidaturas")->assertCreated();
        $applicationId = $created->json('data.id');

        Sanctum::actingAs($owner, ['recruiter']);
        $this->patchJson("/api/admin/candidaturas/{$applicationId}", [
            'stage' => CandidaturaStatus::Interview->value,
            'notes' => 'Movido após triagem técnica.',
        ])->assertOk();

        $history = $this->getJson("/api/admin/candidaturas/{$applicationId}/historico")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $stages = collect($history->json('data'))->pluck('stage')->all();
        $this->assertContains(CandidaturaStatus::New->value, $stages);
        $this->assertContains(CandidaturaStatus::Interview->value, $stages);
        $this->assertDatabaseHas('candidatura_movimentacoes', [
            'candidatura_id' => $applicationId,
            'user_id' => $owner->id,
            'status_anterior' => CandidaturaStatus::New->value,
            'status_novo' => CandidaturaStatus::Interview->value,
            'observacao' => 'Movido após triagem técnica.',
        ]);

        Sanctum::actingAs($candidate, ['candidate']);
        $this->getJson("/api/candidaturas/{$applicationId}/historico")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        Sanctum::actingAs($this->candidate(), ['candidate']);
        $this->getJson("/api/candidaturas/{$applicationId}/historico")->assertForbidden();
    }

    /**
     * @return array{0: User, 1: Candidatura}
     */
    private function ownedApplication(array $attributes = []): array
    {
        $owner = $this->recruiter();
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $application = $this->candidatura(
            $candidate,
            $resume,
            $this->vaga($owner),
            $attributes,
        );

        return [$owner, $application];
    }
}
