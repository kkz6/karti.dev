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
            'enabled'        => ['required', 'boolean'],
            'host'           => ['nullable', 'required_if:enabled,true', 'string', 'max:255', 'not_regex:/^[a-z][a-z0-9+.-]*:\/\//i'],
            'port'           => ['nullable', 'required_if:enabled,true', 'integer', 'between:1,65535'],
            'username'       => ['nullable', 'string', 'max:255'],
            'password'       => ['nullable', 'string', 'max:2048'],
            'clear_password' => ['required', 'boolean'],
            'encryption'     => ['required', Rule::in(['tls', 'ssl'])],
            'from_address'   => ['nullable', 'required_if:enabled,true', 'email:rfc', 'max:254'],
            'from_name'      => ['nullable', 'required_if:enabled,true', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->boolean('enabled') || ! $this->filled('username')) {
                return;
            }

            $hasSavedPassword = app(EmailSettings::class)->password !== '';
            if ((! $this->filled('password') && ! $hasSavedPassword) || $this->boolean('clear_password')) {
                $validator->errors()->add('password', 'Enter a password when SMTP authentication uses a username.');
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
}
