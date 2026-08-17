<?php

namespace App\Http\Requests;

use Illuminate\Validation\Validator;

class UpdateVagaRequest extends StoreVagaRequest
{
    public function rules(): array
    {
        return $this->rulesFor(true);
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->hasAny(['salario_min', 'salario_max'])) {
                return;
            }

            $vaga = $this->route('vaga');
            $minimum = $this->exists('salario_min')
                ? $this->input('salario_min')
                : $vaga?->salario_min;
            $maximum = $this->exists('salario_max')
                ? $this->input('salario_max')
                : $vaga?->salario_max;

            if ($minimum !== null && $maximum !== null && (float) $maximum < (float) $minimum) {
                $validator->errors()->add(
                    'salario_max',
                    'O salário máximo deve ser maior ou igual ao salário mínimo.',
                );
            }
        }];
    }
}
