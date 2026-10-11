<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Billing\Models\Customer;

class SaveCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->route('customer')
            ? $this->user()->can('update', $this->route('customer'))
            : $this->user()->can('create', Customer::class);
    }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach (['display_name', 'legal_name', 'phone', 'tax_identifier', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code'] as $field) {
            if (is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }
        foreach (['billing_country', 'default_currency'] as $field) {
            if (is_string($this->input($field))) {
                $values[$field] = strtoupper(trim($this->input($field))) ?: null;
            }
        }
        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'type'                   => ['required', Rule::in(['business', 'individual'])],
            'display_name'           => ['required', 'string', 'max:255'],
            'legal_name'             => ['nullable', 'string', 'max:255'],
            'phone'                  => ['nullable', 'string', 'max:50'],
            'website'                => ['nullable', 'url:http,https', 'max:500'],
            'tax_identifier'         => ['nullable', 'string', 'max:100'],
            'billing_address'        => ['nullable', 'string', 'max:255'],
            'billing_address_line_2' => ['nullable', 'string', 'max:255'],
            'billing_city'           => ['nullable', 'string', 'max:100'],
            'billing_state'          => ['nullable', 'string', 'max:100'],
            'billing_postal_code'    => ['nullable', 'string', 'max:30'],
            'billing_country'        => ['nullable', 'string', 'regex:/^[A-Z]{2}$/'],
            'default_currency'       => ['nullable', 'string', 'regex:/^[A-Z]{3}$/'],
            'internal_notes'         => ['nullable', 'string', 'max:10000'],
        ];
    }
}
