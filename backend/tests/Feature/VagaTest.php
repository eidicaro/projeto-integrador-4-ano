<?php

namespace Tests\Feature;

use App\Enums\VagaStatus;
use App\Models\Vaga;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VagaTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_index_returns_only_published_non_expired_jobs(): void
    {
        $owner = $this->recruiter();
        $visible = $this->vaga($owner, [
            'status' => VagaStatus::Published,
            'data_limite' => today()->addDay(),
        ]);
        $this->vaga($owner, ['status' => VagaStatus::Paused]);
        $this->vaga($owner, [
            'status' => VagaStatus::Published,
            'data_limite' => today()->subDay(),
        ]);
        $this->vaga($owner, ['status' => VagaStatus::Archived]);

        $this->getJson('/api/vagas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id)
            ->assertJsonPath('data.0.isOpen', true);
    }

    public function test_public_show_hides_paused_and_expired_jobs_but_owner_can_preview_them(): void
    {
        $owner = $this->recruiter();
        $paused = $this->vaga($owner, ['status' => VagaStatus::Paused]);
        $expired = $this->vaga($owner, [
            'status' => VagaStatus::Published,
            'data_limite' => today()->subDay(),
        ]);

        $this->getJson("/api/vagas/{$paused->id}")->assertNotFound();
        $this->getJson("/api/vagas/{$expired->id}")->assertNotFound();

        Sanctum::actingAs($owner, ['recruiter']);
        $this->getJson("/api/vagas/{$paused->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $paused->id);
        $this->getJson("/api/vagas/{$expired->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $expired->id);
    }

    public function test_public_job_responses_hide_private_recruiter_fields(): void
    {
        $job = $this->vaga($this->recruiter(), [
            'email_candidatura' => 'interno@example.com',
            'salario_min' => 7000,
            'salario_max' => 9000,
            'salario_visivel' => false,
        ]);

        $this->getJson('/api/vagas')
            ->assertOk()
            ->assertJsonPath('data.0.id', $job->id)
            ->assertJsonPath('data.0.salaryVisible', false)
            ->assertJsonMissingPath('data.0.applicationEmail')
            ->assertJsonMissingPath('data.0.salaryMin')
            ->assertJsonMissingPath('data.0.salaryMax');

        $this->getJson("/api/vagas/{$job->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.applicationEmail')
            ->assertJsonMissingPath('data.salaryMin')
            ->assertJsonMissingPath('data.salaryMax');
    }

    public function test_public_salary_sort_never_uses_hidden_salary_values(): void
    {
        $owner = $this->recruiter();
        $visibleLow = $this->vaga($owner, [
            'salario_min' => 3000,
            'salario_max' => 4000,
            'salario_visivel' => true,
        ]);
        $visibleHigh = $this->vaga($owner, [
            'salario_min' => 8000,
            'salario_max' => 10000,
            'salario_visivel' => true,
        ]);
        $hiddenHigh = $this->vaga($owner, [
            'salario_min' => 100000,
            'salario_max' => 120000,
            'salario_visivel' => false,
        ]);
        $hiddenLow = $this->vaga($owner, [
            'salario_min' => 1,
            'salario_max' => 2,
            'salario_visivel' => false,
        ]);

        $ascending = $this->getJson('/api/vagas?sort=salary_asc&per_page=10')->assertOk();
        $this->assertSame([
            $visibleLow->id,
            $visibleHigh->id,
            $hiddenLow->id,
            $hiddenHigh->id,
        ], collect($ascending->json('data'))->pluck('id')->all());

        $descending = $this->getJson('/api/vagas?sort=salary_desc&per_page=10')->assertOk();
        $this->assertSame([
            $visibleHigh->id,
            $visibleLow->id,
            $hiddenLow->id,
            $hiddenHigh->id,
        ], collect($descending->json('data'))->pluck('id')->all());
    }

    public function test_candidate_cannot_create_or_manage_jobs(): void
    {
        $candidate = $this->candidate();
        $job = $this->vaga($this->recruiter());
        Sanctum::actingAs($candidate, ['candidate']);

        $this->postJson('/api/admin/vagas', $this->vagaPayload())->assertForbidden();
        $this->patchJson("/api/admin/vagas/{$job->id}", ['title' => 'Título alterado indevidamente'])->assertForbidden();
        $this->patchJson("/api/admin/vagas/{$job->id}/status", ['status' => VagaStatus::Archived->value])->assertForbidden();
        $this->deleteJson("/api/admin/vagas/{$job->id}")->assertForbidden();

        $this->assertDatabaseCount('vagas', 1);
        $this->assertNotSame('Título alterado indevidamente', $job->fresh()->titulo);
    }

    public function test_recruiter_creates_job_with_every_admin_create_field(): void
    {
        $recruiter = $this->recruiter();
        Sanctum::actingAs($recruiter, ['recruiter']);

        $payload = $this->vagaPayload();
        $response = $this->postJson('/api/admin/vagas', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', $payload['title'])
            ->assertJsonPath('data.company', $payload['company'])
            ->assertJsonPath('data.department', $payload['department'])
            ->assertJsonPath('data.location', $payload['location'])
            ->assertJsonPath('data.employmentType', $payload['employmentType'])
            ->assertJsonPath('data.workMode', $payload['workMode'])
            ->assertJsonPath('data.seniority', $payload['seniority'])
            ->assertJsonPath('data.openings', $payload['openings'])
            ->assertJsonPath('data.applicationEmail', $payload['applicationEmail'])
            ->assertJsonPath('data.applicationDeadline', $payload['applicationDeadline'])
            ->assertJsonPath('data.salaryMin', fn ($value): bool => (float) $value === (float) $payload['salaryMin'])
            ->assertJsonPath('data.salaryMax', fn ($value): bool => (float) $value === (float) $payload['salaryMax'])
            ->assertJsonPath('data.salaryVisible', true)
            ->assertJsonPath('data.description', $payload['description'])
            ->assertJsonPath('data.responsibilities', $payload['responsibilities'])
            ->assertJsonPath('data.requirements', $payload['requirements'])
            ->assertJsonPath('data.tags', $payload['tags'])
            ->assertJsonPath('data.benefits', $payload['benefits'])
            ->assertJsonPath('data.image', $payload['image'])
            ->assertJsonPath('data.status', VagaStatus::Published->value)
            ->assertJsonPath('data.isOpen', true);

        $job = Vaga::sole();
        $this->assertSame($recruiter->id, $job->created_by);
        $this->assertNotNull($job->slug);
        $this->assertNotNull($job->publicada_em);
    }

    public function test_owner_can_partially_update_job_but_another_recruiter_cannot(): void
    {
        $owner = $this->recruiter();
        $intruder = $this->recruiter();
        $job = $this->vaga($owner);

        Sanctum::actingAs($owner, ['recruiter']);
        $this->patchJson("/api/admin/vagas/{$job->id}", [
            'title' => 'Nova vaga de Engenharia',
            'salaryMin' => 7500,
            'salaryMax' => 10500,
            'salaryVisible' => false,
        ])->assertOk()
            ->assertJsonPath('data.title', 'Nova vaga de Engenharia')
            ->assertJsonPath('data.salaryMin', fn ($value): bool => (float) $value === 7500.0)
            ->assertJsonPath('data.salaryMax', fn ($value): bool => (float) $value === 10500.0)
            ->assertJsonPath('data.salaryVisible', false);

        Sanctum::actingAs($intruder, ['recruiter']);
        $this->patchJson("/api/admin/vagas/{$job->id}", [
            'title' => 'Alteração não autorizada',
        ])->assertForbidden();

        $this->assertSame('Nova vaga de Engenharia', $job->fresh()->titulo);
    }

    public function test_admin_index_is_scoped_to_authenticated_recruiter(): void
    {
        $owner = $this->recruiter();
        $other = $this->recruiter();
        $ownJob = $this->vaga($owner);
        $this->vaga($other);

        Sanctum::actingAs($owner, ['recruiter']);

        $this->getJson('/api/admin/vagas')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownJob->id);
    }

    public function test_admin_index_rejects_an_unknown_status_filter(): void
    {
        Sanctum::actingAs($this->recruiter(), ['recruiter']);

        $this->getJson('/api/admin/vagas?status=status-inexistente')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_partial_salary_update_respects_the_other_persisted_bound(): void
    {
        $owner = $this->recruiter();
        $job = $this->vaga($owner, [
            'salario_min' => 5000,
            'salario_max' => 10000,
        ]);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/vagas/{$job->id}", [
            'salaryMax' => 4999,
        ])->assertUnprocessable()->assertJsonValidationErrors('salario_max');

        $this->patchJson("/api/admin/vagas/{$job->id}", [
            'salaryMin' => 10001,
        ])->assertUnprocessable()->assertJsonValidationErrors('salario_max');

        $job->refresh();
        $this->assertSame(5000.0, (float) $job->salario_min);
        $this->assertSame(10000.0, (float) $job->salario_max);
    }

    public function test_owner_can_change_job_status_and_publishing_sets_timestamp(): void
    {
        $owner = $this->recruiter();
        $job = $this->vaga($owner, [
            'status' => VagaStatus::Draft,
            'publicada_em' => null,
        ]);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->patchJson("/api/admin/vagas/{$job->id}/status", [
            'status' => VagaStatus::Published->value,
        ])->assertOk()
            ->assertJsonPath('data.status', VagaStatus::Published->value)
            ->assertJsonPath('data.isOpen', true);

        $this->assertNotNull($job->fresh()->publicada_em);

        $this->patchJson("/api/admin/vagas/{$job->id}/status", [
            'status' => 'status-inexistente',
        ])->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_duplicate_copies_fields_as_paused_job_without_applications(): void
    {
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner, ['recruiter']);

        $response = $this->postJson("/api/admin/vagas/{$job->id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('data.status', VagaStatus::Paused->value)
            ->assertJsonPath('data.applicantsCount', 0);

        $copy = Vaga::findOrFail($response->json('data.id'));
        $this->assertSame($owner->id, $copy->created_by);
        $this->assertSame($job->empresa, $copy->empresa);
        $this->assertSame($job->tags, $copy->tags);
        $this->assertNull($copy->publicada_em);
        $this->assertNotSame($job->slug, $copy->slug);
    }

    public function test_bulk_actions_update_only_owned_jobs_and_are_atomic_on_foreign_id(): void
    {
        $owner = $this->recruiter();
        $other = $this->recruiter();
        $first = $this->vaga($owner);
        $second = $this->vaga($owner);
        $foreign = $this->vaga($other);
        Sanctum::actingAs($owner, ['recruiter']);

        $this->postJson('/api/admin/vagas/bulk', [
            'ids' => [$first->id, $second->id],
            'action' => 'arquivar',
        ])->assertOk();

        $this->assertSame(VagaStatus::Archived, $first->fresh()->status);
        $this->assertSame(VagaStatus::Archived, $second->fresh()->status);

        $this->postJson('/api/admin/vagas/bulk', [
            'ids' => [$first->id, $foreign->id],
            'action' => 'pausar',
        ])->assertForbidden();

        $this->assertSame(VagaStatus::Archived, $first->fresh()->status);
        $this->assertSame(VagaStatus::Published, $foreign->fresh()->status);
    }

    public function test_owner_delete_uses_soft_delete_and_other_recruiter_is_forbidden(): void
    {
        $owner = $this->recruiter();
        $other = $this->recruiter();
        $job = $this->vaga($owner);

        Sanctum::actingAs($other, ['recruiter']);
        $this->deleteJson("/api/admin/vagas/{$job->id}")->assertForbidden();

        Sanctum::actingAs($owner, ['recruiter']);
        $this->deleteJson("/api/admin/vagas/{$job->id}")->assertNoContent();

        $this->assertSoftDeleted('vagas', ['id' => $job->id]);
        $this->getJson("/api/vagas/{$job->id}")->assertNotFound();
    }
}
