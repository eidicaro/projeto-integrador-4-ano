<?php

namespace App\Http\Requests;

use App\Enums\CandidaturaStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualCandidaturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isRecruiter() === true;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [
            'nome' => trim((string) ($this->input('nome') ?? $this->input('name'))),
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'telefone' => trim((string) ($this->input('telefone') ?? $this->input('phone'))),
            'localizacao' => trim((string) ($this->input('localizacao') ?? $this->input('location'))),
            'experiencia' => trim((string) ($this->input('experiencia') ?? $this->input('experience'))),
            'status' => $this->input('status') ?? $this->input('stage') ?? CandidaturaStatus::New->value,
        ];

        if ($this->exists('habilidades') || $this->exists('skills')) {
            $normalized['habilidades'] = $this->exists('habilidades')
                ? $this->input('habilidades')
                : $this->input('skills');
        }

        if ($this->exists('observacoes') || $this->exists('notes')) {
            $normalized['observacoes'] = $this->exists('observacoes')
                ? $this->input('observacoes')
                : $this->input('notes');
        }

        $this->merge($normalized);

        if (is_string($this->input('habilidades'))) {
            $this->merge([
                'habilidades' => array_values(array_filter(array_map('trim', explode(',', $this->input('habilidades'))))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'min:3', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:254'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'localizacao' => ['nullable', 'string', 'max:150'],
            'experiencia' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::enum(CandidaturaStatus::class), Rule::notIn([CandidaturaStatus::Withdrawn->value])],
            'habilidades' => ['sometimes', 'array', 'max:50'],
            'habilidades.*' => ['string', 'max:80', 'distinct:ignore_case'],
            'observacoes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
