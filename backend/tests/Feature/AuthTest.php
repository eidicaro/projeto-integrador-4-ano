<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_normalizes_frontend_payload_and_never_accepts_privilege_escalation(): void
    {
        $response = $this->postJson('/api/register', [
            'nome' => '  Maria da Silva  ',
            'email' => '  MARIA@EXAMPLE.COM ',
            'telefone' => '(15) 99999-1234',
            'senha' => 'SenhaForte123',
            'confirmarSenha' => 'SenhaForte123',
            'aceitouTermos' => true,
            'role' => UserRole::Recruiter->value,
            'ativo' => false,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.name', 'Maria da Silva')
            ->assertJsonPath('data.user.email', 'maria@example.com')
            ->assertJsonPath('data.user.telefone', '15999991234')
            ->assertJsonPath('data.user.role', UserRole::Candidate->value)
            ->assertJsonPath('data.user.ativo', true)
            ->assertJsonMissingPath('data.user.password');

        $user = User::sole();
        $this->assertSame(UserRole::Candidate, $user->role);
        $this->assertTrue($user->ativo);
        $this->assertNotNull($user->termos_aceitos_em);
        $this->assertTrue(Hash::check('SenhaForte123', $user->password));
    }

    public function test_registration_rejects_weak_password(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Maria da Silva',
            'email' => 'maria@example.com',
            'telefone' => '15999991234',
            'password' => 'senhafraca',
            'password_confirmation' => 'senhafraca',
            'accepted_terms' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_requires_valid_phone_and_terms_acceptance(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Maria da Silva',
            'email' => 'maria@example.com',
            'telefone' => '123',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
            'accepted_terms' => false,
        ])->assertUnprocessable()->assertJsonValidationErrors(['telefone', 'accepted_terms']);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_login_rejects_invalid_credentials_without_issuing_token(): void
    {
        $user = $this->candidate(['email' => 'candidate@example.com']);

        $this->postJson('/api/login', [
            'email' => strtoupper($user->email),
            'password' => 'senha-incorreta',
            'issue_token' => true,
            'device_name' => 'phpunit',
        ])->assertUnauthorized()->assertJsonMissingPath('data.token');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_rejects_inactive_account_even_with_correct_password(): void
    {
        $user = $this->candidate([
            'email' => 'inactive@example.com',
            'password' => 'SenhaForte123',
            'ativo' => false,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'SenhaForte123',
            'issue_token' => true,
            'device_name' => 'phpunit',
        ])->assertForbidden()->assertJsonPath('message', 'Esta conta está desativada. Entre em contato com o suporte.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertNull($user->fresh()->ultimo_login_em);
    }

    public function test_existing_token_of_inactive_account_cannot_access_protected_routes_but_can_logout(): void
    {
        $user = $this->candidate(['ativo' => false]);
        $token = $user->createToken('existing-session', ['candidate']);

        $this->withToken($token->plainTextToken)
            ->getJson('/api/me')
            ->assertForbidden()
            ->assertJsonStructure(['message']);

        $this->withToken($token->plainTextToken)
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }

    public function test_login_can_issue_scoped_token_and_updates_last_login(): void
    {
        $user = $this->recruiter([
            'email' => 'recruiter@example.com',
            'password' => 'SenhaForte123',
            'ultimo_login_em' => null,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => ' RECRUITER@EXAMPLE.COM ',
            'password' => 'SenhaForte123',
            'issue_token' => true,
            'device_name' => 'Navegador de teste',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user.role', UserRole::Recruiter->value)
            ->assertJsonPath('data.user.email', 'recruiter@example.com');

        $this->assertIsString($response->json('data.token'));
        $this->assertNotSame('', $response->json('data.token'));
        $this->assertNotNull($user->fresh()->ultimo_login_em);
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'Navegador de teste',
        ]);
        $this->assertTrue($user->tokens()->firstOrFail()->can('recruiter'));
    }

    public function test_me_requires_authentication_and_returns_current_user_only(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();

        $user = $this->candidate();
        Sanctum::actingAs($user, ['candidate']);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_profile_update_normalizes_contact_data_without_allowing_role_changes(): void
    {
        $user = $this->candidate();
        Sanctum::actingAs($user, ['candidate']);

        $this->patchJson('/api/me', [
            'name' => '  Nome Atualizado  ',
            'email' => ' NOVO.EMAIL@EXAMPLE.COM ',
            'telefone' => '(15) 99999-1234',
            'role' => UserRole::Recruiter->value,
        ])->assertOk()
            ->assertJsonPath('data.user.name', 'Nome Atualizado')
            ->assertJsonPath('data.user.email', 'novo.email@example.com')
            ->assertJsonPath('data.user.telefone', '15999991234')
            ->assertJsonPath('data.user.role', UserRole::Candidate->value);

        $this->assertSame(UserRole::Candidate, $user->fresh()->role);
    }

    public function test_logout_revokes_only_the_current_bearer_token(): void
    {
        $user = $this->candidate();
        $current = $user->createToken('current', ['candidate']);
        $other = $user->createToken('other', ['candidate']);

        $this->withToken($current->plainTextToken)
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $current->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $other->accessToken->id]);
    }

    public function test_logout_invalidates_a_stateful_session_without_deleting_the_transient_token(): void
    {
        $user = $this->candidate();
        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);

        $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonPath('data.token', null);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);

        $this->postJson('/api/logout')->assertNoContent();

        Auth::forgetGuards();
        $this->getJson('/api/me')->assertUnauthorized();
        $this->assertGuest('web');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_all_revokes_every_token(): void
    {
        $user = $this->candidate();
        $current = $user->createToken('current', ['candidate']);
        $user->createToken('other', ['candidate']);

        $this->withToken($current->plainTextToken)
            ->postJson('/api/logout-all')
            ->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_forgot_password_uses_the_same_generic_response_for_known_and_unknown_accounts(): void
    {
        $user = $this->candidate();

        $known = $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->json('message');
        $unknown = $this->postJson('/api/forgot-password', ['email' => 'unknown@example.com'])
            ->assertOk()
            ->json('message');

        $this->assertSame($known, $unknown);
    }

    public function test_password_reset_changes_the_password_and_revokes_personal_tokens(): void
    {
        $user = $this->candidate();
        $user->createToken('existing-device', ['candidate']);
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NovaSenhaForte123',
            'password_confirmation' => 'NovaSenhaForte123',
        ])->assertOk();

        $this->assertTrue(Hash::check('NovaSenhaForte123', $user->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_login_is_throttled_after_five_attempts_per_email_and_ip(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'throttled@example.com',
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/login', [
            'email' => 'throttled@example.com',
            'password' => 'wrong-password',
        ])->assertTooManyRequests()->assertHeader('Retry-After');
    }

    public function test_login_throttle_cannot_be_bypassed_with_email_case_or_whitespace_variations(): void
    {
        $variations = [
            ' Rate-Limited@Example.COM ',
            'rate-limited@example.com',
            'RATE-LIMITED@EXAMPLE.COM',
            '  rate-limited@example.com',
            'rate-limited@example.com  ',
        ];

        foreach ($variations as $email) {
            $this->postJson('/api/login', [
                'email' => $email,
                'password' => 'wrong-password',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/login', [
            'email' => '  RaTe-LiMiTeD@eXaMpLe.CoM  ',
            'password' => 'wrong-password',
        ])->assertTooManyRequests()->assertHeader('Retry-After');
    }

    public function test_registration_is_throttled_after_three_attempts_per_ip(): void
    {
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->postJson('/api/register', [])->assertUnprocessable();
        }

        $this->postJson('/api/register', [])->assertTooManyRequests()->assertHeader('Retry-After');
    }
}
