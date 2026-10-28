<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Billing\Models\Payment;
use Modules\Billing\Support\PaymentMethods;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('invoice')) && $this->user()->can('record', [Payment::class, $this->route('invoice')]);
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('request_key'))) {
            $this->merge(['request_key' => strtolower(trim($this->input('request_key')))]);
        }
        foreach (['reference', 'notes'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field)) ?: null]);
            }
        }
    }

    public function rules(): array
    {
        return ['version'  => ['required', 'integer', 'min:1'], 'request_key' => ['required', 'uuid'],
            'amount'       => ['required', 'string', 'max:24', 'regex:/^\d+(?:\.\d{1,4})?$/'], 'currency' => ['required', 'string', 'size:3'],
            'payment_date' => ['required', 'date_format:Y-m-d'], 'method' => ['required', 'string', 'max:100', Rule::in(array_column(PaymentMethods::options(false), 'value'))],
            'reference'    => ['nullable', 'string', 'max:255'], 'notes' => ['nullable', 'string', 'max:2000'],
            'send_receipt' => ['sometimes', 'boolean']];
    }
}
