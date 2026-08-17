<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateRecruiterCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_prompts_for_missing_data_and_creates_an_active_recruiter_with_hashed_password(): void
    {
        $this->artisan('app:create-recruiter')
            ->expectsQuestion('E-mail corporativo', ' Recruiter@Example.COM ')
            ->expectsQuestion('Nome completo', ' Recrutadora Principal ')
            ->expectsQuestion($this->passwordQuestion(), 'SenhaForte123')
            ->expectsQuestion('Confirme a senha', 'SenhaForte123')
            ->assertSuccessful();

        $recruiter = User::sole();
        $this->assertSame('recruiter@example.com', $recruiter->email);
        $this->assertSame('Recrutadora Principal', $recruiter->name);
        $this->assertSame(UserRole::Recruiter, $recruiter->role);
        $this->assertTrue($recruiter->ativo);
        $this->assertNotSame('SenhaForte123', $recruiter->password);
        $this->assertTrue(Hash::check('SenhaForte123', $recruiter->password));
    }

    public function test_command_rejects_a_duplicate_email_without_creating_another_user(): void
    {
        $existing = $this->candidate(['email' => 'duplicate@example.com']);

        $this->artisan('app:create-recruiter', [
            'email' => ' DUPLICATE@EXAMPLE.COM ',
            '--name' => 'Novo Recrutador',
        ])->expectsQuestion($this->passwordQuestion(), 'SenhaForte123')
            ->expectsQuestion('Confirme a senha', 'SenhaForte123')
            ->assertFailed();

        $this->assertDatabaseCount('users', 1);
        $this->assertSame(UserRole::Candidate, $existing->fresh()->role);
    }

    public function test_command_rejects_mismatched_password_confirmation_without_persisting(): void
    {
        $this->artisan('app:create-recruiter', [
            'email' => 'recruiter@example.com',
            '--name' => 'Novo Recrutador',
        ])->expectsQuestion($this->passwordQuestion(), 'SenhaForte123')
            ->expectsQuestion('Confirme a senha', 'OutraSenha123')
            ->assertFailed();

        $this->assertDatabaseCount('users', 0);
    }

    private function passwordQuestion(): string
    {
        return "Senha (m\u{00ED}nimo de 8 caracteres, com mai\u{00FA}scula, min\u{00FA}scula e n\u{00FA}mero)";
    }
}
