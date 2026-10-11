<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Billing\Models\Service;
use Modules\Billing\Support\Currencies;

class SaveServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('service') ? $this->user()->can('update', $this->route('service')) : $this->user()->can('create', Service::class);
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'unit', 'rate', 'currency'] as $field) {
            if (is_string($this->input($field))) {
                $value = trim($this->input($field));
                $this->merge([$field => $field === 'currency' ? strtoupper($value) : $value]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:10000'],
            'unit'           => ['required', 'string', 'max:50'],
            'rate'           => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,4})?$/'],
            'currency'       => ['required', Rule::in(Currencies::codes())],
            'tax_rate_ids'   => ['present', 'array', 'max:10'],
            'tax_rate_ids.*' => ['integer', 'distinct', Rule::exists('billing_tax_rates', 'id')],
        ];
    }

    public function messages(): array
    {
        return ['rate.regex' => 'Enter a nonnegative price up to 999999999.9999 with at most four decimal places.'];
    }
}
