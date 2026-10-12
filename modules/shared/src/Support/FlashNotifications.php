<?php

namespace Modules\Shared\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FlashNotifications
{
    public static function from(Request $request): array
    {
        foreach (['error' => 'error', 'billing_pdf_error' => 'error', 'warning' => 'warning', 'success' => 'success', 'billing_message' => 'success', 'info' => 'info', 'newsletter_status' => 'success'] as $key => $kind) {
            if ($message = $request->session()->get($key)) {
                if (is_string($message)) {
                    return [['id' => (string) Str::uuid(), 'kind' => $kind, 'message' => $message]];
                }
            }
        }
        foreach (['settings_saved' => 'Settings saved.', 'billing_settings_saved' => 'Billing settings saved.', 'contact_updated' => 'Contact status updated.'] as $key => $message) {
            if ($request->session()->get($key)) {
                return [['id' => (string) Str::uuid(), 'kind' => 'success', 'message' => $message]];
            }
        }
        $contact = $request->session()->get('contact_status');
        if (is_array($contact) && is_string($contact['message'] ?? null)) {
            return [['id' => (string) Str::uuid(), 'kind' => 'success', 'message' => $contact['message'].(isset($contact['reference']) ? ' Reference '.$contact['reference'].'.' : '')]];
        }
        $status = $request->session()->get('status');
        if (is_string($status) && $status !== '') {
            $message = ['verification-link-sent' => 'Verification email sent.', 'password-updated' => 'Password updated.'][$status] ?? $status;

            return [['id' => (string) Str::uuid(), 'kind' => 'success', 'message' => $message]];
        }

        return [];
    }
}
