<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) ($this->input('name') ?? $this->input('nome'))),
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'telefone' => preg_replace('/\D+/', '', (string) $this->input('telefone')),
            'password' => $this->input('password') ?? $this->input('senha'),
            'password_confirmation' => $this->input('password_confirmation') ?? $this->input('confirmarSenha'),
            'accepted_terms' => $this->boolean('accepted_terms') || $this->boolean('aceitouTermos'),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:254', 'unique:users,email'],
            'telefone' => ['required', 'digits_between:10,11'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'accepted_terms' => ['accepted'],
            'foto' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=4096,max_height=4096'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'accepted_terms' => 'aceite dos termos',
        ];
    }
}
