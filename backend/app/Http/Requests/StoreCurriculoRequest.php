<?php

namespace App\Http\Requests;

use App\Enums\FormacaoTipo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCurriculoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCandidate() === true;
    }

    protected function prepareForValidation(): void
    {
        $normalized = [];

        if ($this->exists('links')) {
            $links = $this->input('links');
            if (is_string($links)) {
                $links = array_values(array_filter(array_map(
                    'trim',
                    preg_split('/[,\r\n]+/', $links) ?: [],
                )));
            }

            $normalized['links'] = $links;
        }

        if ($this->exists('habilidades')) {
            $habilidades = $this->input('habilidades');
            if (is_string($habilidades)) {
                $habilidades = array_map(
                    fn (string $item) => ['nome' => trim($item)],
                    array_filter(explode(',', $habilidades), fn (string $item) => trim($item) !== ''),
                );
            } elseif (is_array($habilidades)) {
                $habilidades = array_map(
                    fn ($item) => is_string($item) ? ['nome' => trim($item)] : $item,
                    $habilidades,
                );
            }

            $normalized['habilidades'] = $habilidades;
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
            'nome_completo' => ['required', 'string', 'min:3', 'max:150'],
            'area_atuacao' => ['nullable', 'string', 'max:120'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email:rfc', 'max:254'],
            'cidade_estado' => ['nullable', 'string', 'max:150'],
            'links' => ['nullable', 'array', 'max:10'],
            'links.*' => ['url:http,https', 'max:2048'],
            'resumo' => ['nullable', 'string', 'max:5000'],
            'experiencias' => ['sometimes', 'array', 'max:20'],
            'experiencias.*.cargo' => ['required', 'string', 'max:120'],
            'experiencias.*.empresa' => ['required', 'string', 'max:150'],
            'experiencias.*.periodo' => ['required', 'string', 'max:100'],
            'experiencias.*.descricao' => ['nullable', 'string', 'max:3000'],
            'formacoes' => ['sometimes', 'array', 'max:20'],
            'formacoes.*.tipo' => ['required', Rule::enum(FormacaoTipo::class)],
            'formacoes.*.curso' => ['required', 'string', 'max:150'],
            'formacoes.*.instituicao' => ['required', 'string', 'max:150'],
            'formacoes.*.periodo' => ['required', 'string', 'max:100'],
            'cursos' => ['sometimes', 'array', 'max:30'],
            'cursos.*.nome' => ['required', 'string', 'max:150'],
            'cursos.*.instituicao' => ['required', 'string', 'max:150'],
            'cursos.*.periodo' => ['required', 'string', 'max:100'],
            'habilidades' => ['sometimes', 'array', 'max:50'],
            'habilidades.*.nome' => ['required', 'string', 'max:80', 'distinct:ignore_case'],
            'idiomas' => ['sometimes', 'array', 'max:20'],
            'idiomas.*.idioma' => ['required', 'string', 'max:80'],
            'idiomas.*.nivel' => ['required', 'string', 'max:80'],
        ];
    }
}
