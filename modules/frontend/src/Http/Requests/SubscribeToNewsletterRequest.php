<?php

namespace Modules\Frontend\Http\Requests;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Validator;

class SubscribeToNewsletterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'email'      => ['bail', 'required', 'string', 'max:254', config('newsletter.validate_dns') ? 'email:rfc,dns' : 'email:rfc', 'indisposable'],
            'website'    => ['nullable', 'string', 'max:0'],
            'started_at' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.indisposable'  => 'Please use a permanent email address; temporary email addresses are not accepted.',
            'email.email'         => 'Enter a valid email address with a working mail domain.',
            'website.max'         => 'We could not verify this submission. Please refresh the page and try again.',
            'started_at.required' => 'Please refresh the page before subscribing.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('started_at')) {
                return;
            }
            try {
                $started = Crypt::decryptString((string) $this->input('started_at'));
                $age     = now()->timestamp - (int) $started;
                if (! ctype_digit($started) || $age < config('newsletter.minimum_form_seconds') || $age > 86400) {
                    $validator->errors()->add('started_at', 'Please refresh the page and try subscribing again.');
                }
            } catch (DecryptException) {
                $validator->errors()->add('started_at', 'Please refresh the page and try subscribing again.');
            }
        }];
    }
}
