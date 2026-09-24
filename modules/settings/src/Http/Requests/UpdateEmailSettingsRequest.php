<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Settings\Settings\EmailSettings;

class UpdateEmailSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'enabled'              => ['required', 'boolean'],
            'provider'             => ['required', Rule::in(['smtp', 'resend'])],
            'host'                 => ['nullable', Rule::requiredIf($this->usesEnabledSmtp()), 'string', 'max:255', 'not_regex:/^[a-z][a-z0-9+.-]*:\/\//i'],
            'port'                 => ['nullable', Rule::requiredIf($this->usesEnabledSmtp()), 'integer', 'between:1,65535'],
            'username'             => ['nullable', 'string', 'max:255'],
            'password'             => ['nullable', 'string', 'max:2048'],
            'clear_password'       => ['required', 'boolean'],
            'resend_api_key'       => ['nullable', 'string', 'max:2048'],
            'clear_resend_api_key' => ['required', 'boolean'],
            'encryption'           => ['nullable', Rule::in(['tls', 'ssl'])],
            'from_address'         => ['nullable', 'required_if:enabled,true', 'email:rfc', 'max:254'],
            'from_name'            => ['nullable', 'required_if:enabled,true', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->boolean('enabled')) {
                return;
            }

            $settings = app(EmailSettings::class);

            if ($this->input('provider') === 'smtp' && $this->filled('username')) {
                $hasSavedPassword = $settings->password !== '';
                if ((! $this->filled('password') && ! $hasSavedPassword) || $this->boolean('clear_password')) {
                    $validator->errors()->add('password', 'Enter a password when SMTP authentication uses a username.');
                }
            }

            if ($this->input('provider') === 'resend') {
                $hasSavedApiKey = $settings->resend_api_key !== '';
                if ((! $this->filled('resend_api_key') && ! $hasSavedApiKey) || $this->boolean('clear_resend_api_key')) {
                    $validator->errors()->add('resend_api_key', 'Enter a Resend API key before enabling Resend delivery.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return [
            'host.not_regex'             => 'Enter only the SMTP host name, without http:// or https://.',
            'from_address.required_if'   => 'Enter the address that outgoing email should come from.',
            'from_address.email'         => 'Enter a valid sender email address.',
            'from_name.required_if'      => 'Enter the sender name shown on outgoing email.',
        ];
    }

    private function usesEnabledSmtp(): bool
    {
        return $this->boolean('enabled') && $this->input('provider', 'smtp') === 'smtp';
    }
}
