<?php

namespace Tests\Feature;

use App\Models\Habilidade;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class CurriculoTest extends TestCase
{
    use RefreshDatabase;

    public function test_candidate_creates_complete_nested_resume(): void
    {
        $candidate = $this->candidate();
        Sanctum::actingAs($candidate, ['candidate']);

        $payload = $this->curriculoPayload();
        $response = $this->postJson('/api/curriculos', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('data.userId', $candidate->id)
            ->assertJsonPath('data.nome_completo', $payload['nome_completo'])
            ->assertJsonCount(1, 'data.experiencias')
            ->assertJsonCount(1, 'data.formacoes')
            ->assertJsonPath('data.formacoes.0.tipo', $payload['formacoes'][0]['tipo'])
            ->assertJsonCount(1, 'data.cursos')
            ->assertJsonCount(2, 'data.habilidades')
            ->assertJsonCount(1, 'data.idiomas');

        $resumeId = $response->json('data.id');
        $this->assertDatabaseHas('curriculos', [
            'id' => $resumeId,
            'user_id' => $candidate->id,
            'nome_completo' => $payload['nome_completo'],
        ]);
        $this->assertDatabaseHas('experiencias', ['curriculo_id' => $resumeId, 'cargo' => 'Desenvolvedora']);
        $this->assertDatabaseHas('formacoes', [
            'curriculo_id' => $resumeId,
            'tipo' => $payload['formacoes'][0]['tipo'],
            'instituicao' => 'Fatec',
        ]);
        $this->assertDatabaseHas('cursos', ['curriculo_id' => $resumeId, 'nome' => 'Laravel Avançado']);
        $this->assertDatabaseHas('habilidades', ['curriculo_id' => $resumeId, 'nome' => 'Laravel']);
        $this->assertDatabaseHas('idiomas', ['curriculo_id' => $resumeId, 'idioma' => 'Inglês']);
    }

    public function test_nested_resume_creation_rolls_back_everything_when_a_child_write_fails(): void
    {
        $candidate = $this->candidate();
        Sanctum::actingAs($candidate, ['candidate']);

        Habilidade::creating(static function (): never {
            throw new RuntimeException('Falha simulada ao persistir habilidade.');
        });

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/curriculos', $this->curriculoPayload());
            $this->fail('A falha simulada deveria ter escapado do request.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Falha simulada ao persistir habilidade.', $exception->getMessage());
        }

        $this->assertDatabaseCount('curriculos', 0);
        $this->assertDatabaseCount('experiencias', 0);
        $this->assertDatabaseCount('formacoes', 0);
        $this->assertDatabaseCount('cursos', 0);
        $this->assertDatabaseCount('habilidades', 0);
        $this->assertDatabaseCount('idiomas', 0);
    }

    public function test_candidate_can_have_only_one_resume(): void
    {
        $candidate = $this->candidate();
        Sanctum::actingAs($candidate, ['candidate']);

        $this->postJson('/api/curriculos', $this->curriculoPayload())->assertCreated();
        $this->postJson('/api/curriculos', $this->curriculoPayload([
            'nome_completo' => 'Outra versão do currículo',
        ]))->assertConflict();

        $this->assertDatabaseCount('curriculos', 1);
        $this->assertSame(1, $candidate->curriculo()->count());
    }

    public function test_formation_type_must_be_supported(): void
    {
        $candidate = $this->candidate();
        Sanctum::actingAs($candidate, ['candidate']);

        $payload = $this->curriculoPayload();
        $payload['formacoes'][0]['tipo'] = 'tipo-inexistente';

        $this->postJson('/api/curriculos', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('formacoes.0.tipo');

        $this->assertDatabaseCount('curriculos', 0);
        $this->assertDatabaseCount('formacoes', 0);
    }

    public function test_candidate_cannot_read_or_update_another_candidates_resume(): void
    {
        $owner = $this->candidate();
        $intruder = $this->candidate();
        $resume = $this->curriculo($owner);
        Sanctum::actingAs($intruder, ['candidate']);

        $this->getJson("/api/curriculos/{$resume->id}")->assertForbidden();
        $this->putJson("/api/curriculos/{$resume->id}", $this->curriculoPayload([
            'nome_completo' => 'Alteração indevida',
        ]))->assertForbidden();
        $this->deleteJson("/api/curriculos/{$resume->id}")->assertForbidden();

        $this->assertNotSame('Alteração indevida', $resume->fresh()->nome_completo);
    }

    public function test_recruiter_can_read_resume_only_when_candidate_applied_to_their_job(): void
    {
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $owner = $this->recruiter();
        $otherRecruiter = $this->recruiter();

        Sanctum::actingAs($owner, ['recruiter']);
        $this->getJson("/api/curriculos/{$resume->id}")->assertForbidden();

        $job = $this->vaga($owner);
        $this->candidatura($candidate, $resume, $job);

        $this->getJson("/api/curriculos/{$resume->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $resume->id)
            ->assertJsonPath('data.userId', $candidate->id);

        $this->getJson('/api/curriculos')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $resume->id);

        Sanctum::actingAs($otherRecruiter, ['recruiter']);
        $this->getJson("/api/curriculos/{$resume->id}")->assertForbidden();
        $this->getJson('/api/curriculos')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_update_replaces_provided_nested_sections_and_preserves_omitted_sections(): void
    {
        $candidate = $this->candidate();
        Sanctum::actingAs($candidate, ['candidate']);

        $created = $this->postJson('/api/curriculos', $this->curriculoPayload())->assertCreated();
        $resumeId = $created->json('data.id');

        $response = $this->patchJson("/api/curriculos/{$resumeId}", [
            'nome_completo' => 'Maria da Silva Atualizada',
            'experiencias' => [[
                'cargo' => 'Tech Lead',
                'empresa' => 'Nova Empresa',
                'periodo' => '2025 - atual',
                'descricao' => 'Liderança técnica.',
            ]],
            'habilidades' => [],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.nome_completo', 'Maria da Silva Atualizada')
            ->assertJsonCount(1, 'data.experiencias')
            ->assertJsonPath('data.experiencias.0.cargo', 'Tech Lead')
            ->assertJsonCount(0, 'data.habilidades')
            ->assertJsonCount(1, 'data.formacoes')
            ->assertJsonCount(1, 'data.cursos')
            ->assertJsonCount(1, 'data.idiomas')
            ->assertJsonPath('data.links', [
                'https://www.linkedin.com/in/maria',
                'https://github.com/maria',
            ]);

        $this->assertDatabaseMissing('experiencias', ['curriculo_id' => $resumeId, 'cargo' => 'Desenvolvedora']);
        $this->assertDatabaseHas('experiencias', ['curriculo_id' => $resumeId, 'cargo' => 'Tech Lead']);
        $this->assertDatabaseMissing('habilidades', ['curriculo_id' => $resumeId]);
        $this->assertDatabaseHas('formacoes', ['curriculo_id' => $resumeId, 'instituicao' => 'Fatec']);
    }

    public function test_recruiter_cannot_create_resume_and_candidate_me_endpoint_is_singular(): void
    {
        $recruiter = $this->recruiter();
        Sanctum::actingAs($recruiter, ['recruiter']);
        $this->postJson('/api/curriculos', $this->curriculoPayload())->assertForbidden();

        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        Sanctum::actingAs($candidate, ['candidate']);

        $this->getJson('/api/curriculos/me')
            ->assertOk()
            ->assertJsonPath('data.id', $resume->id);
    }

    public function test_photo_upload_rejects_an_image_wider_than_4096_pixels(): void
    {
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $photo = UploadedFile::fake()->createWithContent(
            'oversized.png',
            $this->png(4097, 1),
        );
        Sanctum::actingAs($candidate, ['candidate']);

        $dimensions = getimagesize($photo->getPathname());
        $this->assertIsArray($dimensions);
        $this->assertSame(4097, $dimensions[0]);

        $this->post(
            "/api/curriculos/{$resume->id}/foto",
            ['foto' => $photo],
            ['Accept' => 'application/json'],
        )->assertUnprocessable()->assertJsonValidationErrors('foto');

        $this->assertNull($resume->fresh()->foto);
    }

    public function test_photo_is_stored_privately_and_served_only_to_authorized_users(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $candidate = $this->candidate();
        $resume = $this->curriculo($candidate);
        $photo = UploadedFile::fake()->createWithContent('avatar.png', $this->png(1, 1));
        Sanctum::actingAs($candidate, ['candidate']);

        $response = $this->post(
            "/api/curriculos/{$resume->id}/foto",
            ['foto' => $photo],
            ['Accept' => 'application/json'],
        )->assertOk();

        $path = $resume->fresh()->foto;
        $this->assertNotNull($path);
        Storage::disk('local')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
        $response->assertJsonPath('data.foto', url("/api/curriculos/{$resume->id}/foto"));

        $this->get("/api/curriculos/{$resume->id}/foto")
            ->assertOk()
            ->assertHeader('content-type', 'image/png')
            ->assertHeader('cache-control', 'no-store, private');

        Sanctum::actingAs($this->candidate(), ['candidate']);
        $this->get("/api/curriculos/{$resume->id}/foto")->assertForbidden();
    }

    private function png(int $width, int $height): string
    {
        $chunk = static function (string $type, string $data): string {
            return pack('N', strlen($data))
                .$type
                .$data
                .hex2bin(hash('crc32b', $type.$data));
        };

        $header = pack('NNCCCCC', $width, $height, 8, 2, 0, 0, 0);
        $scanlines = str_repeat("\0".str_repeat("\0", $width * 3), $height);

        return "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', $header)
            .$chunk('IDAT', gzcompress($scanlines, 9))
            .$chunk('IEND', '');
    }
}
