<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_api_response_has_security_headers(): void
    {
        $this->getJson('/api/vagas')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_error_api_response_has_security_headers_too(): void
    {
        $this->getJson('/api/me')
            ->assertUnauthorized()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_authenticated_api_response_cannot_be_cached(): void
    {
        Sanctum::actingAs($this->candidate(), ['candidate']);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_hsts_is_added_only_for_secure_production_request(): void
    {
        $this->app->instance('env', 'production');

        $this->getJson('https://localhost/api/vagas')
            ->assertOk()
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
}
