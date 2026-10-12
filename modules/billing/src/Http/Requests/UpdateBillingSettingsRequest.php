<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\Currencies;

class UpdateBillingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', BillingSettings::class);
    }

    protected function prepareForValidation(): void
    {
        foreach (['display_name', 'legal_name', 'address', 'address_line_2', 'city', 'state', 'postal_code', 'tax_identifier', 'email', 'phone', 'number_prefix'] as $field) {
            if (is_string($this->input($field))) {
                $value = trim($this->input($field));
                $this->merge([$field => $field === 'email' ? strtolower($value) : $value]);
            }
        }
        foreach (['country', 'default_currency'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => strtoupper(trim($this->input($field))) ?: null]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'display_name'      => ['nullable', 'string', 'max:255'], 'legal_name' => ['nullable', 'string', 'max:255'],
            'address'           => ['nullable', 'string', 'max:255'], 'address_line_2' => ['nullable', 'string', 'max:255'],
            'city'              => ['nullable', 'string', 'max:100'], 'state' => ['nullable', 'string', 'max:100'],
            'postal_code'       => ['nullable', 'string', 'max:30'], 'country' => ['nullable', 'string', 'regex:/^[A-Z]{2}$/'],
            'tax_identifier'    => ['nullable', 'string', 'max:100'], 'email' => ['nullable', 'email', 'max:254'],
            'phone'             => ['nullable', 'string', 'max:50'],
            'logo_media_id'     => ['nullable', 'integer', Rule::exists('media', 'id')->where(fn ($query) => $query->whereNull('original_media_id')->whereIn('mime_type', ['image/jpeg', 'image/png', 'image/webp']))],
            'timezone'          => ['required', 'timezone'], 'default_currency' => ['nullable', Rule::in(Currencies::codes())],
            'due_days'          => ['required', 'integer', 'between:0,365'],
            'number_prefix'     => ['required', 'string', 'max:20', 'regex:~^[A-Za-z0-9][A-Za-z0-9._/-]*$~'],
            'number_padding'    => ['required', 'integer', 'between:1,10'],
            'payment_methods'   => ['sometimes', 'array', 'max:100'],
            'payment_methods.*' => ['required', 'distinct', Rule::in(array_column(\Modules\Billing\Support\PaymentMethods::options(false), 'value'))],
            'default_terms'     => ['nullable', 'string', 'max:10000'], 'payment_instructions' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
