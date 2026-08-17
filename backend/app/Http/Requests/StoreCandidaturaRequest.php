<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCandidaturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCandidate() === true;
    }

    public function rules(): array
    {
        return [
            'vaga_id' => ['required', 'integer', 'exists:vagas,id'],
            'curriculo_id' => ['nullable', 'integer'],
            'curriculo_origem' => ['nullable', Rule::in(['online', 'arquivo'])],
            'curriculo_arquivo' => [
                Rule::requiredIf(fn (): bool => $this->input('curriculo_origem') === 'arquivo'),
                'nullable',
                'file',
                'mimes:pdf',
                'max:5120',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $vaga = $this->route('vaga');
        if ($vaga !== null) {
            $this->merge(['vaga_id' => is_object($vaga) ? $vaga->getKey() : $vaga]);
        }
    }
}
