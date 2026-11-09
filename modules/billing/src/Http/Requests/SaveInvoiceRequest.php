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

        $billing                                                    = ['billing_details' => ['sometimes', 'array:customer,seller'], 'billing_details.customer' => ['sometimes', 'array:display_name,legal_name,billing_address,billing_address_line_2,billing_city,billing_state,billing_postal_code,billing_country,tax_identifier,phone'], 'billing_details.seller' => ['sometimes', 'array:legal_name,address,address_line_2,city,state,postal_code,country,tax_identifier,email,phone']];
        $billing['billing_details.customer.display_name']           = ['required_with:billing_details.customer', 'string', 'max:255'];
        $billing['billing_details.customer.legal_name']             = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.billing_address']        = ['required_with:billing_details.customer', 'string', 'max:255'];
        $billing['billing_details.customer.billing_address_line_2'] = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.billing_city']           = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.billing_state']          = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.billing_postal_code']    = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.billing_country']        = ['required_with:billing_details.customer', 'string', 'max:255', 'regex:/^[A-Z]{2}$/'];
        $billing['billing_details.customer.tax_identifier']         = ['nullable', 'string', 'max:255'];
        $billing['billing_details.customer.phone']                  = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.legal_name']               = ['required_with:billing_details.seller', 'string', 'max:255'];
        $billing['billing_details.seller.address']                  = ['required_with:billing_details.seller', 'string', 'max:255'];
        $billing['billing_details.seller.address_line_2']           = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.city']                     = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.state']                    = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.postal_code']              = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.country']                  = ['required_with:billing_details.seller', 'string', 'max:255', 'regex:/^[A-Z]{2}$/'];
        $billing['billing_details.seller.tax_identifier']           = ['nullable', 'string', 'max:255'];
        $billing['billing_details.seller.email']                    = ['nullable', 'string', 'max:255', 'email'];
        $billing['billing_details.seller.phone']                    = ['nullable', 'string', 'max:255'];

        return [
            ...$billing,
            'customer_id'                 => ['required', 'integer', Rule::exists('billing_customers', 'id'), Rule::when($this->route('customer') !== null, fn () => Rule::in([$this->route('customer')->id]))],
            'version'                     => [$this->route('invoice') ? 'required' : 'nullable', 'integer', 'min:1'],
            'invoice_date'                => ['required', 'date_format:Y-m-d'], 'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:invoice_date'],
            'currency'                    => ['required', Rule::in(Currencies::codes())],
            'discount_mode'               => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'discount_value'              => [...$decimal, 'numeric', Rule::when($this->input('discount_mode') === 'percent', ['max:100'])],
            'customer_note'               => ['nullable', 'string', 'max:10000'], 'internal_note' => ['nullable', 'string', 'max:10000'],
            'terms'                       => ['nullable', 'string', 'max:10000'], 'payment_instructions' => ['nullable', 'string', 'max:10000'],
            'refresh_customer'            => ['sometimes', 'boolean'],
            'correct_payment_currency'    => ['sometimes', 'boolean'],
            'items'                       => ['required', 'array', 'list', 'min:1', 'max:100'],
            'items.*.key'                 => ['required', 'uuid', 'distinct'],
            'items.*.service_id'          => ['nullable', 'integer', Rule::exists('billing_services', 'id')],
            'items.*.description'         => ['required', 'string', 'max:1000'], 'items.*.additional_description' => ['nullable', 'string', 'max:10000'],
            'items.*.unit'                => ['nullable', 'string', 'max:50'],
            'items.*.quantity'            => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,5})(?:\.[0-9]{1,4})?$/', 'numeric', 'gt:0'],
            'items.*.rate'                => $decimal,
            'items.*.taxes'               => ['present', 'array', 'list', 'max:10'],
            'items.*.taxes.*.tax_rate_id' => ['nullable', 'integer', Rule::exists('billing_tax_rates', 'id')],
            'items.*.taxes.*.name'        => ['required', 'string', 'max:100'],
            'items.*.taxes.*.percentage'  => ['required', 'string', 'regex:/^(?:0|[1-9][0-9]{0,2})(?:\.[0-9]{1,4})?$/', 'numeric', 'between:0,100'],
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_id'                              => 'customer',
            'items.*.description'                      => 'item description',
            'items.*.additional_description'           => 'item details',
            'items.*.quantity'                         => 'quantity',
            'items.*.rate'                             => 'unit price',
            'items.*.unit'                             => 'unit',
            'items.*.taxes.*.name'                     => 'tax name',
            'items.*.taxes.*.percentage'               => 'tax percentage',
            'billing_details.customer.display_name'    => 'customer name',
            'billing_details.customer.billing_address' => 'billing address',
            'billing_details.customer.billing_country' => 'billing country',
        ];
    }

    public function messages(): array
    {
        return [
            'items.*.description.required'                   => 'Enter an item description.',
            'items.*.quantity.required'                      => 'Enter a quantity.',
            'items.*.quantity.gt'                            => 'Quantity must be greater than zero.',
            'items.*.quantity.regex'                         => 'Enter a valid quantity with up to four decimal places.',
            'items.*.rate.required'                          => 'Enter a unit price.',
            'items.*.rate.regex'                             => 'Enter a positive unit price or zero, with up to four decimal places.',
            'billing_details.customer.billing_country.regex' => 'Enter a two-letter country code, such as IN or IE.',
        ];
    }
}
