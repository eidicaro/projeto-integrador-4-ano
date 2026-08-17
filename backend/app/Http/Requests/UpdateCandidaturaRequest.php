<?php

namespace App\Http\Requests;

use App\Enums\CandidaturaStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCandidaturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isRecruiter() === true;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];
        $aliases = [
            'status' => 'stage',
            'avaliacao' => 'rating',
            'observacoes' => 'notes',
        ];

        foreach ($aliases as $field => $alias) {
            if ($this->exists($field)) {
                $normalized[$field] = $this->input($field);
            } elseif ($this->exists($alias)) {
                $normalized[$field] = $this->input($alias);
            }
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::enum(CandidaturaStatus::class), Rule::notIn([CandidaturaStatus::Withdrawn->value])],
            'avaliacao' => ['sometimes', 'nullable', 'integer', 'between:0,5'],
            'observacoes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
