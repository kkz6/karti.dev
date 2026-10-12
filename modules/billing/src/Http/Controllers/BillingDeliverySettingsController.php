<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Billing\Exceptions\SmsDeliveryException;
use Modules\Billing\Services\SmsDelivery;
use Modules\Billing\Settings\BillingDeliverySettings;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\DeliveryTemplates;
use Modules\Settings\Settings\EmailSettings;
use Modules\Shared\Http\Controllers\BaseController;

class BillingDeliverySettingsController extends BaseController
{
    public function edit(Request $request)
    {
        $this->authorize('view', BillingSettings::class);
        $settings = app(BillingDeliverySettings::class);
        $email    = app(EmailSettings::class);

        return Inertia::render('billing::delivery-settings', [
            'settings'      => [...Arr::except($settings->toArray(), ['twilio_auth_token', 'msg91_auth_key']), 'templates' => $settings->resolvedTemplates(), 'msg91_templates' => $settings->resolvedProviderTemplates()],
            'credentials'   => ['twilio' => $settings->twilio_auth_token !== '', 'msg91' => $settings->msg91_auth_key !== ''],
            'emailProvider' => $email->enabled ? strtoupper($email->provider) : strtoupper((string) config('mail.default')),
            'fields'        => DeliveryTemplates::FIELDS, 'canUpdate' => $request->user()->can('update', BillingSettings::class),
            'message'       => $request->session()->get('billing_message'),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize('update', BillingSettings::class);
        $settings = app(BillingDeliverySettings::class);
        $twilio   = $request->boolean('sms_enabled') && $request->input('sms_provider') === 'twilio';
        $rules    = [
            'sms_enabled'        => ['required', 'boolean'], 'sms_provider' => ['required', Rule::in(['twilio', 'msg91'])],
            'twilio_account_sid' => ['nullable', Rule::requiredIf($twilio), 'string', 'regex:/^AC[a-fA-F0-9]{32}$/D'],
            'twilio_auth_token'  => ['nullable', 'string', 'max:2048'], 'clear_twilio_auth_token' => ['required', 'boolean'],
            'twilio_from'        => ['nullable', Rule::requiredIf($twilio), 'string', 'regex:/^(\+[1-9]\d{7,14}|[A-Za-z][A-Za-z0-9 ]{0,10})$/D'],
            'msg91_auth_key'     => ['nullable', 'string', 'max:2048'], 'clear_msg91_auth_key' => ['required', 'boolean'],
            'msg91_templates'    => ['required', 'array:'.implode(',', DeliveryTemplates::EVENTS)],
            'templates'          => ['required', 'array:'.implode(',', DeliveryTemplates::EVENTS)],
        ];
        foreach (DeliveryTemplates::EVENTS as $event) {
            $rules['msg91_templates.'.$event]                = ['required', 'array:id,variables'];
            $rules['msg91_templates.'.$event.'.id']          = ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_-]+$/D'];
            $rules['msg91_templates.'.$event.'.variables']   = ['present', 'array', 'max:20'];
            $rules['msg91_templates.'.$event.'.variables.*'] = ['required', Rule::in(DeliveryTemplates::FIELDS)];
            $rules['templates.'.$event]                      = ['required', 'array:email_subject,email_message,sms_message'];
            foreach (['email_subject' => 255, 'email_message' => 5000, 'sms_message' => 1600] as $field => $max) {
                $rules['templates.'.$event.'.'.$field] = ['required', 'string', 'max:'.$max, function ($attribute, $value, $fail) {
                    preg_match_all('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', $value, $matches);
                    if (array_diff($matches[1], DeliveryTemplates::FIELDS)) {
                        $fail('Use only the supported notification fields.');
                    }
                }];
            }
            $rules['templates.'.$event.'.email_subject'][] = 'not_regex:/[\r\n]/';
        }
        $data = $request->validate($rules);
        foreach ($data['msg91_templates'] as $template) {
            foreach (array_keys($template['variables']) as $key) {
                if (! preg_match('/^[A-Za-z][A-Za-z0-9_]{0,49}$/D', $key) || strtolower($key) === 'mobiles') {
                    throw ValidationException::withMessages(['msg91_templates' => 'MSG91 variable names must be letters, numbers or underscores and cannot be mobiles.']);
                }
            }
        }
        foreach (['twilio_auth_token', 'msg91_auth_key'] as $secret) {
            $value = (string) ($data[$secret] ?? '');
            if ($value === '' && ! $data['clear_'.$secret]) {
                unset($data[$secret]);
            } else {
                $data[$secret] = $value;
            }
            unset($data['clear_'.$secret]);
        }
        if ($data['sms_enabled']) {
            $field = $data['sms_provider'] === 'twilio' ? 'twilio_auth_token' : 'msg91_auth_key';
            if (($data[$field] ?? $settings->{$field}) === '') {
                throw ValidationException::withMessages([$field => 'Enter credentials before enabling this SMS driver.']);
            }
            if ($data['sms_provider'] === 'msg91' && empty($data['msg91_templates']['invoice']['id'])) {
                throw ValidationException::withMessages(['msg91_templates.invoice.id' => 'Enter an approved invoice template ID before enabling MSG91.']);
            }
        }
        foreach (['twilio_account_sid', 'twilio_from'] as $field) {
            $data[$field] = $data[$field] ?? '';
        }
        foreach ($data['msg91_templates'] as &$template) {
            $template['id'] = $template['id'] ?? '';
        }
        unset($template);
        $settings->fill($data)->save();

        return to_route('admin.settings.billing.edit', ['section' => 'delivery'])->with('billing_message', 'Delivery settings saved.');
    }

    public function test(Request $request, SmsDelivery $driver)
    {
        $this->authorize('update', BillingSettings::class);
        $this->authorize('send', new \Modules\Billing\Models\Invoice);
        $input = $request->validate(['recipient' => ['required', 'string', 'max:50']]);
        $phone = DeliveryTemplates::phone($input['recipient']);
        if (! $phone) {
            throw ValidationException::withMessages(['recipient' => 'Enter a phone number with its international country code.']);
        }
        $settings  = $driver->settings();
        $variables = array_fill_keys(DeliveryTemplates::FIELDS, 'Test');
        $variables = [...$variables, 'invoice_number' => 'TEST-001', 'invoice_total' => '100.00', 'amount_due' => '100.00', 'currency' => 'INR', 'invoice_link' => config('app.url'), 'days_overdue' => '0'];
        $template  = $settings->resolvedProviderTemplates()['invoice'];
        $payload   = ['template_id' => $template['id'], 'variables' => array_map(fn ($field) => $variables[$field], $template['variables'])];
        try {
            $reference = $driver->send($settings->sms_provider, $phone, DeliveryTemplates::render($settings->resolvedTemplates()['invoice']['sms_message'], $variables), $payload);

            return response()->json(['message' => 'Test SMS accepted by the provider.', 'reference' => $reference]);
        } catch (SmsDeliveryException $error) {
            return response()->json(['message' => $error->getMessage()], 422);
        }
    }
}
