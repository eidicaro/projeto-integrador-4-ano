<?php

namespace Tests\Feature;

use App\Enums\VagaStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VagaSalvaTest extends TestCase
{
    use RefreshDatabase;

    public function test_saved_job_routes_require_an_authenticated_candidate(): void
    {
        $job = $this->vaga($this->recruiter());

        $this->getJson('/api/vagas-salvas')->assertUnauthorized();
        $this->putJson("/api/vagas/{$job->id}/salvar")->assertUnauthorized();
        $this->deleteJson("/api/vagas/{$job->id}/salvar")->assertUnauthorized();

        Sanctum::actingAs($this->recruiter(), ['recruiter']);

        $this->getJson('/api/vagas-salvas')->assertForbidden();
        $this->putJson("/api/vagas/{$job->id}/salvar")->assertForbidden();
        $this->deleteJson("/api/vagas/{$job->id}/salvar")->assertForbidden();

        $this->assertDatabaseCount('vagas_salvas', 0);
    }

    public function test_candidate_can_save_an_open_job_idempotently_but_not_a_closed_job(): void
    {
        $candidate = $this->candidate();
        $owner = $this->recruiter();
        $open = $this->vaga($owner);
        $paused = $this->vaga($owner, ['status' => VagaStatus::Paused]);
        $expired = $this->vaga($owner, [
            'status' => VagaStatus::Published,
            'data_limite' => today()->subDay(),
        ]);
        Sanctum::actingAs($candidate, ['candidate']);

        $this->putJson("/api/vagas/{$open->id}/salvar")
            ->assertOk()
            ->assertJsonPath('message', 'Vaga salva com sucesso.')
            ->assertJsonPath('data.id', $open->id);

        $this->putJson("/api/vagas/{$open->id}/salvar")->assertOk();
        $this->putJson("/api/vagas/{$paused->id}/salvar")->assertNotFound();
        $this->putJson("/api/vagas/{$expired->id}/salvar")->assertNotFound();

        $this->assertDatabaseCount('vagas_salvas', 1);
        $this->assertDatabaseHas('vagas_salvas', [
            'user_id' => $candidate->id,
            'vaga_id' => $open->id,
        ]);
    }

    public function test_saved_job_index_contains_only_the_candidates_own_open_jobs(): void
    {
        $candidate = $this->candidate();
        $otherCandidate = $this->candidate();
        $owner = $this->recruiter();
        $ownOpen = $this->vaga($owner);
        $ownPaused = $this->vaga($owner, ['status' => VagaStatus::Paused]);
        $ownExpired = $this->vaga($owner, [
            'status' => VagaStatus::Published,
            'data_limite' => today()->subDay(),
        ]);
        $otherOpen = $this->vaga($owner);

        $candidate->vagasSalvas()->attach([$ownOpen->id, $ownPaused->id, $ownExpired->id]);
        $otherCandidate->vagasSalvas()->attach($otherOpen->id);
        Sanctum::actingAs($candidate, ['candidate']);

        $this->getJson('/api/vagas-salvas?per_page=10')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownOpen->id)
            ->assertJsonPath('data.0.isOpen', true)
            ->assertJsonPath('meta.total', 1);

        $this->assertDatabaseCount('vagas_salvas', 4);
    }

    public function test_candidate_can_remove_a_saved_job_without_affecting_another_candidate(): void
    {
        $candidate = $this->candidate();
        $otherCandidate = $this->candidate();
        $job = $this->vaga($this->recruiter());
        $candidate->vagasSalvas()->attach($job->id);
        $otherCandidate->vagasSalvas()->attach($job->id);
        Sanctum::actingAs($candidate, ['candidate']);

        $this->deleteJson("/api/vagas/{$job->id}/salvar")->assertNoContent();
        $this->deleteJson("/api/vagas/{$job->id}/salvar")->assertNoContent();

        $this->assertDatabaseMissing('vagas_salvas', [
            'user_id' => $candidate->id,
            'vaga_id' => $job->id,
        ]);
        $this->assertDatabaseHas('vagas_salvas', [
            'user_id' => $otherCandidate->id,
            'vaga_id' => $job->id,
        ]);
        $this->assertDatabaseCount('vagas_salvas', 1);
    }
}
