<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('customer'));
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'email', 'phone', 'title'] as $field) {
            if (is_string($this->input($field))) {
                $value = trim($this->input($field));
                $this->merge([$field => $field === 'email' ? strtolower($value) : $value]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:254'],
            'phone'          => ['nullable', 'string', 'max:50'],
            'title'          => ['nullable', 'string', 'max:100'],
            'is_primary'     => ['required', 'boolean'],
            'invoice_emails' => ['required', 'boolean'],
        ];
    }
}
