<?php

namespace Modules\Settings\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\TestEmailSettingsRequest;
use Modules\Settings\Http\Requests\UpdateEmailSettingsRequest;
use Modules\Settings\Mail\EmailDeliveryTest;
use Modules\Settings\Settings\EmailSettings;
use Modules\Settings\Support\EmailConfiguration;
use Throwable;

class EmailSettingsController
{
    public function edit(Request $request, EmailSettings $settings): Response
    {
        return Inertia::render('settings/email', [
            'emailSettings'      => Arr::except($settings->toArray(), ['password', 'resend_api_key']),
            'passwordConfigured' => $settings->password !== '',
            'apiKeyConfigured'   => $settings->resend_api_key !== '',
            'environmentMailer'  => (string) $request->attributes->get('environment_mailer', config('mail.default')),
            'testRecipient'      => (string) $request->user()->email,
        ]);
    }

    public function update(UpdateEmailSettingsRequest $request, EmailSettings $settings): RedirectResponse
    {
        $validated     = $request->validated();
        $password      = (string) ($validated['password'] ?? '');
        $clearPassword = (bool) $validated['clear_password'];
        $apiKey        = (string) ($validated['resend_api_key'] ?? '');
        $clearApiKey   = (bool) $validated['clear_resend_api_key'];

        $values                 = Arr::except($validated, ['password', 'clear_password', 'resend_api_key', 'clear_resend_api_key']);
        $values['host']         = trim((string) ($values['host'] ?? ''));
        $values['port']         = (int) ($values['port'] ?? $settings->port);
        $values['username']     = trim((string) ($values['username'] ?? ''));
        $values['encryption']   = (string) ($values['encryption'] ?? $settings->encryption);
        $values['from_address'] = trim((string) ($values['from_address'] ?? ''));
        $values['from_name']    = trim((string) ($values['from_name'] ?? ''));

        if ($password !== '') {
            $values['password'] = $password;
        } elseif ($clearPassword) {
            $values['password'] = '';
        }

        if ($apiKey !== '') {
            $values['resend_api_key'] = $apiKey;
        } elseif ($clearApiKey) {
            $values['resend_api_key'] = '';
        }

        $settings->fill($values)->save();
        Mail::purge('smtp');
        Mail::purge('resend');

        return to_route('admin.settings.email.edit')->with('settings_saved', true);
    }

    public function test(TestEmailSettingsRequest $request, EmailSettings $settings, EmailConfiguration $configuration): JsonResponse
    {
        if (! $settings->enabled) {
            return response()->json(['message' => 'Enable and save a custom email provider before sending a test.'], 422);
        }

        try {
            $configuration->run(fn () => Mail::to($request->validated('recipient'))->send(
                new EmailDeliveryTest($settings->provider)
            ));
        } catch (Throwable $exception) {
            report($exception);

            $reason  = Str::limit(Str::squish(strip_tags($exception->getMessage())), 240);
            $secrets = array_filter([$settings->password, $settings->resend_api_key]);
            if ($secrets !== []) {
                $reason = str_replace($secrets, '[redacted]', $reason);
            }

            return response()->json([
                'message' => $reason !== ''
                    ? 'The provider rejected the test email: '.$reason
                    : 'The test email could not be sent. Check the credentials and verified sender, then try again.',
            ], 422);
        }

        return response()->json([
            'message' => 'Test email sent successfully to '.$request->validated('recipient').'.',
        ]);
    }
}
