<?php

namespace Modules\Frontend\Http\Requests;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Frontend\Rules\ValidTurnstileToken;
use Modules\Frontend\Services\Turnstile;

class StoreContactSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name'    => is_string($this->input('name')) ? trim($this->input('name')) : $this->input('name'),
            'email'   => is_string($this->input('email')) ? strtolower(trim($this->input('email'))) : $this->input('email'),
            'subject' => is_string($this->input('subject')) ? trim($this->input('subject')) : $this->input('subject'),
            'message' => is_string($this->input('message')) ? trim($this->input('message')) : $this->input('message'),
        ]);
    }

    public function rules(): array
    {
        $captchaEnabled = app(Turnstile::class)->enabled();

        return [
            'name'             => ['bail', 'required', 'string', 'max:120'],
            'email'            => ['bail', 'required', 'string', 'max:254', 'email:rfc', 'indisposable'],
            'topic'            => ['required', Rule::in(['general', 'project', 'consulting', 'visa', 'speaking', 'other'])],
            'subject'          => ['bail', 'required', 'string', 'min:4', 'max:160'],
            'message'          => ['bail', 'required', 'string', 'min:20', 'max:5000'],
            'source_url'       => ['nullable', 'url:http,https', 'max:2048'],
            'website'          => ['nullable', 'string', 'max:0'],
            'started_at'       => ['required', 'string'],
            'turnstile_token'  => [Rule::requiredIf($captchaEnabled), 'nullable', 'string', 'max:2048', new ValidTurnstileToken],
        ];
    }

    public function messages(): array
    {
        return [
            'email.indisposable'          => 'Please use a permanent email address so I can reply.',
            'email.email'                 => 'Enter a valid email address.',
            'message.min'                 => 'Add a little more detail so I can understand how to help.',
            'website.max'                 => 'We could not verify this submission. Please refresh the page and try again.',
            'started_at.required'         => 'Please refresh the page before sending your message.',
            'turnstile_token.required'    => 'Complete the security check before sending your message.',
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

                if (! ctype_digit($started) || $age < config('contact.minimum_form_seconds') || $age > 86400) {
                    $validator->errors()->add('started_at', 'Please refresh the page and try sending your message again.');
                }
            } catch (DecryptException) {
                $validator->errors()->add('started_at', 'Please refresh the page and try sending your message again.');
            }
        }];
    }
}
