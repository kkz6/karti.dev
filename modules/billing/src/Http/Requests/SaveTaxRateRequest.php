<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveTaxRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('taxRate') ? $this->user()->can('update', $this->route('taxRate')) : $this->user()->can('create', \Modules\Billing\Models\TaxRate::class);
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'percentage'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:100'],
            'percentage' => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,2})(?:\.[0-9]{1,4})?$/', 'numeric', 'between:0,100'],
        ];
    }
}
