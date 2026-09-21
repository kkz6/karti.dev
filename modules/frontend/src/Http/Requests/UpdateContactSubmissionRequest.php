<?php

namespace Modules\Frontend\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Frontend\Models\ContactSubmission;

class UpdateContactSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                ContactSubmission::STATUS_NEW,
                ContactSubmission::STATUS_READ,
                ContactSubmission::STATUS_RESOLVED,
            ])],
        ];
    }
}
