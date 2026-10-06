<?php

namespace App\Http\Requests;

use App\Models\TalentPoolMembership;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SaveTalentPoolMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCandidate() === true && $this->user()->ativo;
    }

    protected function prepareForValidation(): void
    {
        if (is_array($this->input('interests'))) {
            $this->merge(['interests' => array_map(
                fn ($value) => is_string($value) ? trim($value) : $value,
                $this->input('interests'),
            )]);
        }
    }

    public function rules(): array
    {
        return [
            'interests' => ['required', 'array', 'list', 'min:1', 'max:8', function (string $attribute, mixed $value, Closure $fail): void {
                if (! is_array($value)) {
                    return;
                }
                $keys = array_map(fn ($item) => is_string($item) ? Str::lower(Str::ascii($item)) : '', $value);
                if (count($keys) !== count(array_unique($keys))) {
                    $fail('Não repita áreas de interesse, mesmo com variações de caixa ou acentos.');
                }
            }],
            'interests.*' => ['required', 'string', 'min:2', 'max:120'],
            'consentAccepted' => ['sometimes', 'accepted'],
            'consentVersion' => ['sometimes', 'string', Rule::in([TalentPoolMembership::CONSENT_VERSION])],
        ];
    }

    public function messages(): array
    {
        return [
            'interests.required' => 'Selecione pelo menos uma área de interesse.',
            'interests.min' => 'Selecione pelo menos uma área de interesse.',
            'interests.max' => 'Escolha até oito áreas de interesse.',
            'interests.*.min' => 'Cada área deve ter entre 2 e 120 caracteres.',
            'interests.*.max' => 'Cada área deve ter entre 2 e 120 caracteres.',
            'consentAccepted.accepted' => 'Confirme sua adesão ao Banco de Talentos.',
            'consentVersion.in' => 'A versão do consentimento não é válida.',
        ];
    }
}
