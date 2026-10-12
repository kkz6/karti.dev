<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Support\Currencies;

class SaveInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($customer = $this->route('customer')) {
            if (! $this->user()->can('view', $customer)) {
                return false;
            }
        }

        return $this->route('invoice') ? $this->user()->can('update', $this->route('invoice')) : $this->user()->can('create', Invoice::class);
    }

    public function rules(): array
    {
        $decimal = ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,4})?$/'];

        return [
            'customer_id'                 => ['required', 'integer', Rule::exists('billing_customers', 'id'), Rule::when($this->route('customer') !== null, fn () => Rule::in([$this->route('customer')->id]))],
            'version'                     => [$this->route('invoice') ? 'required' : 'nullable', 'integer', 'min:1'],
            'invoice_date'                => ['required', 'date_format:Y-m-d'], 'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:invoice_date'],
            'currency'                    => ['required', Rule::in(Currencies::codes())],
            'discount_mode'               => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'discount_value'              => [...$decimal, 'numeric', Rule::when($this->input('discount_mode') === 'percent', ['max:100'])],
            'customer_note'               => ['nullable', 'string', 'max:10000'], 'internal_note' => ['nullable', 'string', 'max:10000'],
            'terms'                       => ['nullable', 'string', 'max:10000'], 'payment_instructions' => ['nullable', 'string', 'max:10000'],
            'refresh_customer'            => ['sometimes', 'boolean'],
            'items'                       => ['required', 'array', 'list', 'min:1', 'max:100'],
            'items.*.key'                 => ['required', 'uuid', 'distinct'],
            'items.*.service_id'          => ['nullable', 'integer', Rule::exists('billing_services', 'id')],
            'items.*.description'         => ['required', 'string', 'max:1000'], 'items.*.additional_description' => ['nullable', 'string', 'max:10000'],
            'items.*.unit'                => ['required', 'string', 'max:50'],
            'items.*.quantity'            => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,4})?$/', 'numeric', 'gt:0'],
            'items.*.rate'                => $decimal,
            'items.*.taxes'               => ['present', 'array', 'list', 'max:10'],
            'items.*.taxes.*.tax_rate_id' => ['nullable', 'integer', Rule::exists('billing_tax_rates', 'id')],
            'items.*.taxes.*.name'        => ['required', 'string', 'max:100'],
            'items.*.taxes.*.percentage'  => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,2})(?:\.[0-9]{1,4})?$/', 'numeric', 'between:0,100'],
        ];
    }
}
