<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
