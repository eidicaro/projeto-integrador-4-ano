<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Vaga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('Dados demonstrativos não são criados em produção.');

            return;
        }

        $password = env('SEED_RECRUITER_PASSWORD') ?: 'Point@2026!';

        $recruiter = User::updateOrCreate(
            ['email' => env('SEED_RECRUITER_EMAIL', 'admin@pointmedia.com.br')],
            [
                'name' => env('SEED_RECRUITER_NAME', 'Recrutador Point Media'),
                'telefone' => '11999999999',
                'password' => Hash::make($password),
                'role' => UserRole::Recruiter,
                'ativo' => true,
                'email_verified_at' => now(),
                'termos_aceitos_em' => now(),
            ],
        );

        if (! Vaga::where('created_by', $recruiter->id)->exists()) {
            Vaga::factory()->count(6)->for($recruiter, 'recrutador')->create();
        }

        $this->command?->info('Recrutador local: '.$recruiter->email);
        $this->command?->warn('Defina SEED_RECRUITER_PASSWORD no .env antes de compartilhar o ambiente.');
    }
}
