<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $input = [];

        if ($this->has('name') || $this->has('nome')) {
            $input['name'] = trim((string) ($this->input('name') ?? $this->input('nome')));
        }

        if ($this->has('email')) {
            $input['email'] = mb_strtolower(trim((string) $this->input('email')));
        }

        if ($this->has('telefone')) {
            $input['telefone'] = preg_replace('/\D+/', '', (string) $this->input('telefone'));
        }

        $this->merge($input);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:3', 'max:120'],
            'email' => [
                'sometimes',
                'required',
                'email:rfc',
                'max:254',
                Rule::unique('users', 'email')->ignore($this->user()?->id),
            ],
            'telefone' => ['sometimes', 'required', 'digits_between:10,11'],
        ];
    }
}
