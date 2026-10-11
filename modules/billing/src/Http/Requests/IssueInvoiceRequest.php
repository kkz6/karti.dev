<?php

namespace Modules\Billing\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IssueInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('issue', $this->route('invoice'));
    }

    public function rules(): array
    {
        return ['version' => ['required', 'integer', 'min:1'], 'review_token' => ['required', 'string', 'size:64'], 'refresh_seller' => ['required', 'boolean'], 'refresh_customer' => ['required', 'boolean']];
    }
}
