<?php

namespace Tests\Feature;

use App\Enums\VagaStatus;
use App\Models\Candidatura;
use App\Models\TalentPoolMembership;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TalentPoolTest extends TestCase
{
    use RefreshDatabase;

    private function join(User $candidate, array $interests = ['Tecnologia']): TalentPoolMembership
    {
        Sanctum::actingAs($candidate);
        $this->putJson('/api/banco-de-talentos/me', [
            'interests' => $interests, 'consentAccepted' => true, 'consentVersion' => 'v1',
        ])->assertOk();

        return TalentPoolMembership::where('user_id', $candidate->id)->firstOrFail();
    }

    public function test_join_requires_consent_but_no_resume_and_ignores_client_owner(): void
    {
        $candidate = $this->candidate();
        $other = $this->candidate();
        Sanctum::actingAs($candidate);
        $this->getJson('/api/banco-de-talentos/me')->assertOk()->assertJsonPath('data', null);
        $this->putJson('/api/banco-de-talentos/me', ['interests' => ['Tecnologia']])
            ->assertUnprocessable()->assertJsonValidationErrors('consentAccepted');
        $this->putJson('/api/banco-de-talentos/me', [
            'userId' => $other->id, 'interests' => [' Tecnologia '],
            'consentAccepted' => true, 'consentVersion' => 'v1',
        ])->assertOk()->assertJsonPath('data.userId', $candidate->id)->assertJsonPath('data.interests', ['Tecnologia']);
        $this->assertDatabaseCount('talent_pool_memberships', 1);
        $this->assertDatabaseCount('curriculos', 0);
    }

    public function test_update_leave_and_rejoin_preserve_cycle_dates_and_are_idempotent(): void
    {
        $this->travelTo(now()->startOfSecond());
        $candidate = $this->candidate();
        $talent = $this->join($candidate);
        $joined = $talent->joined_at->toISOString();
        $consent = $talent->consent_accepted_at->toISOString();
        $updated = $talent->interests_updated_at->toISOString();
        $this->travel(1)->days();
        $this->putJson('/api/banco-de-talentos/me', ['interests' => ['Tecnologia']])
            ->assertOk()->assertJsonPath('data.updatedAt', $updated);
        $this->putJson('/api/banco-de-talentos/me', ['interests' => ['Produto']])
            ->assertOk()->assertJsonPath('data.joinedAt', $joined);
        $this->assertSame($consent, $talent->fresh()->consent_accepted_at->toISOString());
        $this->assertNotSame($updated, $talent->fresh()->interests_updated_at->toISOString());
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        $left = $talent->fresh()->left_at->toISOString();
        $this->travel(1)->days();
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        $this->assertSame($left, $talent->fresh()->left_at->toISOString());
        $this->getJson('/api/banco-de-talentos/me')->assertJsonPath('data', null);
        $this->putJson('/api/banco-de-talentos/me', ['interests' => ['Produto']])->assertUnprocessable();
        $this->join($candidate, ['Design']);
        $this->assertNotSame($joined, $talent->fresh()->joined_at->toISOString());
        $this->assertNull($talent->fresh()->left_at);
        $this->assertDatabaseCount('talent_pool_memberships', 1);
    }

    public function test_invalid_interests_and_consent_versions_are_rejected(): void
    {
        Sanctum::actingAs($this->candidate());
        foreach (['invalid', null, [], [' '], ['A'], [str_repeat('x', 121)], array_fill(0, 9, 'Produto'), ['Gestão', 'GESTAO'], [123], ['nested' => ['value']]] as $interests) {
            $this->putJson('/api/banco-de-talentos/me', [
                'interests' => $interests, 'consentAccepted' => true, 'consentVersion' => 'v1',
            ])->assertUnprocessable();
        }
        $this->putJson('/api/banco-de-talentos/me', [
            'interests' => ['Produto'], 'consentAccepted' => true, 'consentVersion' => 'obsolete',
        ])->assertUnprocessable()->assertJsonValidationErrors('consentVersion');
        $this->assertDatabaseCount('talent_pool_memberships', 0);
    }

    public function test_authentication_roles_and_account_isolation(): void
    {
        $this->getJson('/api/banco-de-talentos/me')->assertUnauthorized();
        $this->getJson('/api/admin/banco-de-talentos')->assertUnauthorized();
        $candidate = $this->candidate();
        $this->join($candidate);
        $this->getJson('/api/admin/banco-de-talentos')->assertForbidden();
        Sanctum::actingAs($this->candidate());
        $this->getJson('/api/banco-de-talentos/me')->assertJsonPath('data', null);
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        $this->assertTrue($candidate->talentPoolMembership()->first()->active);
        Sanctum::actingAs($this->recruiter());
        $this->putJson('/api/banco-de-talentos/me', ['interests' => ['Produto']])->assertForbidden();
        $this->deleteJson('/api/banco-de-talentos/me')->assertForbidden();
        Sanctum::actingAs($this->candidate(['ativo' => false]));
        $this->getJson('/api/banco-de-talentos/me')->assertForbidden();
    }

    public function test_search_filters_pagination_and_global_summary(): void
    {
        $candidate = $this->candidate(['name' => 'João da Silva']);
        $resume = $this->curriculo($candidate, ['nome_completo' => 'João da Silva', 'cidade_estado' => 'São Paulo, SP']);
        $resume->habilidades()->create(['nome' => 'React']);
        $resume->experiencias()->create(['cargo' => 'Engenheiro', 'empresa' => 'Point', 'periodo' => '2024']);
        $this->join($candidate, ['Tecnologia']);
        $other = $this->join($this->candidate(['name' => 'Ana']), ['Design']);
        $other->update(['joined_at' => now()->subDays(45)]);
        $inactive = $this->candidate();
        $this->join($inactive, ['Inativo']);
        $inactive->update(['ativo' => false]);
        Sanctum::actingAs($this->recruiter());
        $this->getJson('/api/admin/banco-de-talentos?q=joao+react+sao+engenheiro&per_page=1')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 1)
            ->assertJsonPath('summary.total', 2)->assertJsonPath('summary.newLast30Days', 1)
            ->assertJsonPath('summary.areas', 2)->assertJsonPath('facets.areas', ['Design', 'Tecnologia']);
        $this->getJson('/api/admin/banco-de-talentos?sort=name&per_page=1')
            ->assertJsonPath('data.0.name', 'Ana')->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/admin/banco-de-talentos?sort=name&per_page=1&page=2')->assertJsonPath('data.0.name', 'João da Silva');
        $this->getJson('/api/admin/banco-de-talentos?area=Design&period=7')->assertJsonCount(0, 'data')->assertJsonPath('summary.total', 2);
        $this->getJson('/api/admin/banco-de-talentos?location=S%C3%A3o%20Paulo%2C%20SP')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/banco-de-talentos?sort=complete')->assertJsonPath('data.0.profileCompleteness', 100);
        $this->getJson('/api/admin/banco-de-talentos?sort=oldest')->assertJsonPath('data.0.id', $other->id);
        foreach (['sort=invalid', 'period=20', 'per_page=101', 'page=0'] as $query) {
            $this->getJson('/api/admin/banco-de-talentos?'.$query)->assertUnprocessable();
        }
    }

    public function test_detail_supports_account_fallback_and_hides_departed_participants(): void
    {
        $candidate = $this->candidate(['name' => 'Sem currículo']);
        $talent = $this->join($candidate);
        Sanctum::actingAs($this->recruiter());
        $this->getJson('/api/admin/banco-de-talentos/'.$talent->id)
            ->assertOk()->assertJsonPath('data.name', 'Sem currículo')->assertJsonPath('data.resume', null);
        Sanctum::actingAs($candidate);
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        Sanctum::actingAs($this->recruiter());
        $this->getJson('/api/admin/banco-de-talentos/'.$talent->id)->assertNotFound();
        $this->getJson('/api/admin/banco-de-talentos')->assertJsonCount(0, 'data');
    }

    public function test_resume_and_photo_access_follow_membership_without_prior_application(): void
    {
        Storage::fake('local');
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $talent = $this->join($candidate);
        $this->post('/api/curriculos/'.$resume->id.'/foto', ['foto' => UploadedFile::fake()->createWithContent('photo.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII='))], ['Accept' => 'application/json'])->assertOk();
        Sanctum::actingAs($this->recruiter());
        $this->getJson('/api/curriculos/'.$resume->id)->assertOk();
        $this->get('/api/curriculos/'.$resume->id.'/foto')->assertOk();
        $this->getJson('/api/admin/banco-de-talentos/'.$talent->id)->assertJsonPath('data.resume.id', $resume->id);
        Sanctum::actingAs($candidate);
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        Sanctum::actingAs($this->recruiter());
        $this->getJson('/api/curriculos/'.$resume->id)->assertForbidden();
        $this->getJson('/api/curriculos/'.$resume->id.'/foto')->assertForbidden();
    }

    public function test_referral_preserves_snapshot_history_and_application_access_after_leaving(): void
    {
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate, ['nome_completo' => 'Nome original']);
        $resume->habilidades()->create(['nome' => 'PHP']);
        $talent = $this->join($candidate);
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner);
        $response = $this->postJson('/api/admin/banco-de-talentos/'.$talent->id.'/indicacoes', ['vaga_id' => $job->id])
            ->assertCreated()->assertJsonPath('data.userId', $candidate->id)
            ->assertJsonPath('data.resumeId', $resume->id)->assertJsonPath('data.source', 'banco_de_talentos')
            ->assertJsonPath('data.stage', 'novo')->assertJsonPath('data.resumeSnapshot.nome_completo', 'Nome original');
        $id = $response->json('data.id');
        $this->assertDatabaseHas('candidatura_movimentacoes', ['candidatura_id' => $id, 'user_id' => $owner->id, 'status_novo' => 'novo']);
        $resume->update(['nome_completo' => 'Nome editado']);
        $this->assertSame('Nome original', Candidatura::findOrFail($id)->curriculo_snapshot['nome_completo']);
        Sanctum::actingAs($candidate);
        $this->getJson('/api/minhas-candidaturas')->assertJsonPath('data.0.id', $id);
        $this->deleteJson('/api/banco-de-talentos/me')->assertNoContent();
        $this->patchJson('/api/candidaturas/'.$id.'/retirar')->assertOk();
        Sanctum::actingAs($owner);
        $this->getJson('/api/curriculos/'.$resume->id)->assertOk();
        $this->postJson('/api/admin/banco-de-talentos/'.$talent->id.'/indicacoes', ['vaga_id' => $job->id])->assertNotFound();
    }

    public function test_referral_rejects_foreign_closed_missing_resume_inactive_and_soft_deleted_duplicates(): void
    {
        $candidate = $this->candidate();
        $talent = $this->join($candidate);
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        $foreign = $this->vaga($this->recruiter());
        $closed = $this->vaga($owner, ['status' => VagaStatus::Paused]);
        $expired = $this->vaga($owner, ['data_limite' => today()->subDay()]);
        Sanctum::actingAs($owner);
        $url = '/api/admin/banco-de-talentos/'.$talent->id.'/indicacoes';
        $this->postJson($url, ['vaga_id' => $foreign->id])->assertForbidden();
        $this->postJson($url, ['vaga_id' => $closed->id])->assertConflict();
        $this->postJson($url, ['vaga_id' => $expired->id])->assertConflict();
        $this->postJson($url, ['vaga_id' => 999999])->assertNotFound();
        $this->postJson($url, ['vaga_id' => $job->id])->assertUnprocessable()->assertJsonValidationErrors('curriculo');
        $this->curriculo($candidate);
        $this->postJson($url, ['vaga_id' => $job->id])->assertCreated();
        $this->postJson($url, ['vaga_id' => $job->id])->assertConflict();
        Candidatura::firstOrFail()->delete();
        $this->postJson($url, ['vaga_id' => $job->id])->assertConflict();
        $this->assertDatabaseCount('candidaturas', 1);
        $candidate->update(['ativo' => false]);
        $this->postJson($url, ['vaga_id' => $job->id])->assertNotFound();
    }

    public function test_concurrent_unique_constraint_failure_returns_conflict_and_rolls_back_history(): void
    {
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $talent = $this->join($candidate);
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner);
        // Simulates a competing insert winning after the duplicate check.
        Candidatura::creating(function (): void {
            throw new UniqueConstraintViolationException(
                'testing', 'insert into candidaturas', [], new \PDOException('unique constraint'),
            );
        });
        $this->postJson('/api/admin/banco-de-talentos/'.$talent->id.'/indicacoes', ['vaga_id' => $job->id])
            ->assertConflict()->assertJsonMissingPath('exception');
        $this->assertDatabaseCount('candidaturas', 0);
        $this->assertDatabaseCount('candidatura_movimentacoes', 0);
    }

    public function test_membership_migration_reverts_and_reapplies_without_removing_accounts_or_resumes(): void
    {
        $candidate = $this->candidate();
        $this->curriculo($candidate);
        $this->join($candidate);
        $migration = require database_path('migrations/2026_10_06_000000_create_talent_pool_memberships_table.php');
        $migration->down();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('curriculos', 1);
        $migration->up();
        $this->join($candidate);
        $this->assertDatabaseCount('talent_pool_memberships', 1);
    }

    public function test_manual_email_duplicate_blocks_referral_without_changing_manual_record(): void
    {
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $talent = $this->join($candidate);
        $owner = $this->recruiter();
        $job = $this->vaga($owner);
        Sanctum::actingAs($owner);
        $this->postJson('/api/admin/vagas/'.$job->id.'/candidaturas/manual', ['name' => 'Contato manual', 'email' => $resume->email])->assertCreated();
        $this->postJson('/api/admin/banco-de-talentos/'.$talent->id.'/indicacoes', ['vaga_id' => $job->id])->assertConflict();
        $this->assertDatabaseCount('candidaturas', 1);
        $this->assertNull(Candidatura::firstOrFail()->user_id);
    }
}
