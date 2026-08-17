<?php

namespace App\Http\Requests;

use App\Enums\VagaStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVagaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isRecruiter() === true;
    }

    protected function prepareForValidation(): void
    {
        $map = [
            'title' => 'titulo',
            'company' => 'empresa',
            'department' => 'departamento',
            'location' => 'localizacao',
            'employmentType' => 'tipo_contratacao',
            'workMode' => 'modalidade',
            'seniority' => 'senioridade',
            'openings' => 'quantidade_vagas',
            'applicationEmail' => 'email_candidatura',
            'applicationDeadline' => 'data_limite',
            'salaryMin' => 'salario_min',
            'salaryMax' => 'salario_max',
            'salaryVisible' => 'salario_visivel',
            'description' => 'descricao',
            'responsibilities' => 'responsabilidades',
            'requirements' => 'requisitos',
            'benefits' => 'beneficios',
            'image' => 'imagem',
        ];

        $normalized = [];
        foreach ($map as $source => $target) {
            if (! $this->has($target) && $this->has($source)) {
                $normalized[$target] = $this->input($source);
            }
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return $this->rulesFor(false);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    protected function rulesFor(bool $updating): array
    {
        $sometimes = $updating ? ['sometimes'] : [];

        return [
            'titulo' => [...$sometimes, 'required', 'string', 'min:4', 'max:150'],
            'empresa' => [...$sometimes, 'required', 'string', 'max:150'],
            'departamento' => ['nullable', 'string', 'max:100'],
            'localizacao' => [...$sometimes, 'required', 'string', 'max:150'],
            'tipo_contratacao' => [...$sometimes, 'required', 'string', Rule::in(['CLT', 'Estágio', 'Jovem Aprendiz', 'PJ', 'Temporário', 'Freelancer'])],
            'modalidade' => [...$sometimes, 'required', 'string', Rule::in(['Presencial', 'Híbrido', 'Remoto'])],
            'senioridade' => ['nullable', 'string', Rule::in(['Não informado', 'Trainee', 'Júnior', 'Pleno', 'Sênior', 'Especialista'])],
            'quantidade_vagas' => [...$sometimes, 'required', 'integer', 'min:1', 'max:999'],
            'email_candidatura' => [...$sometimes, 'required', 'email:rfc', 'max:254'],
            'data_limite' => ['nullable', 'date_format:Y-m-d'],
            'salario_min' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'salario_max' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99', 'gte:salario_min'],
            'salario_visivel' => ['sometimes', 'boolean'],
            'descricao' => [...$sometimes, 'required', 'string', 'min:80', 'max:20000'],
            'responsabilidades' => ['nullable', 'string', 'max:20000'],
            'requisitos' => [...$sometimes, 'required', 'string', 'min:30', 'max:20000'],
            'tags' => ['sometimes', 'array', 'max:8'],
            'tags.*' => ['string', 'min:1', 'max:50', 'distinct:ignore_case'],
            'beneficios' => ['sometimes', 'array', 'max:20'],
            'beneficios.*' => ['string', 'min:1', 'max:60', 'distinct:ignore_case'],
            'imagem' => ['nullable', 'url:http,https', 'max:2048'],
            'status' => ['sometimes', Rule::enum(VagaStatus::class)],
        ];
    }
}
