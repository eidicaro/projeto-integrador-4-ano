<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateRecruiter extends Command
{
    protected $signature = 'app:create-recruiter
        {email? : E-mail corporativo do recrutador}
        {--name= : Nome completo do recrutador}';

    protected $description = 'Cria com segurança uma conta de recrutador';

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) ($this->argument('email') ?: $this->ask('E-mail corporativo'))));
        $name = trim((string) ($this->option('name') ?: $this->ask('Nome completo')));
        $password = (string) $this->secret('Senha (mínimo de 8 caracteres, com maiúscula, minúscula e número)');
        $confirmation = (string) $this->secret('Confirme a senha');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:254', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => UserRole::Recruiter,
            'ativo' => true,
        ]);

        $this->info("Recrutador {$email} criado com sucesso.");

        return self::SUCCESS;
    }
}
