<?php

namespace Modules\Settings\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\UpdateEmailSettingsRequest;
use Modules\Settings\Settings\EmailSettings;

class EmailSettingsController
{
    public function edit(Request $request, EmailSettings $settings): Response
    {
        return Inertia::render('settings/email', [
            'emailSettings'      => Arr::except($settings->toArray(), ['password']),
            'passwordConfigured' => $settings->password !== '',
            'environmentMailer'  => (string) $request->attributes->get('environment_mailer', config('mail.default')),
        ]);
    }

    public function update(UpdateEmailSettingsRequest $request, EmailSettings $settings): RedirectResponse
    {
        $validated     = $request->validated();
        $password      = (string) ($validated['password'] ?? '');
        $clearPassword = (bool) $validated['clear_password'];

        $values                 = Arr::except($validated, ['password', 'clear_password']);
        $values['host']         = trim((string) ($values['host'] ?? ''));
        $values['username']     = trim((string) ($values['username'] ?? ''));
        $values['from_address'] = trim((string) ($values['from_address'] ?? ''));
        $values['from_name']    = trim((string) ($values['from_name'] ?? ''));

        if ($password !== '') {
            $values['password'] = $password;
        } elseif ($clearPassword) {
            $values['password'] = '';
        }

        $settings->fill($values)->save();
        Mail::purge('smtp');

        return to_route('admin.settings.email.edit')->with('settings_saved', true);
    }
}
