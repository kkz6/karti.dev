<?php

namespace Modules\Settings\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Settings\Settings\SpamProtectionSettings;

class SpamProtectionSettingsController
{
    public function edit(SpamProtectionSettings $settings)
    {
        $configured = filled($settings->site_key) && filled($settings->secret_key);

        return Inertia::render('settings/protection', [
            'settings'         => Arr::except($settings->toArray(), ['secret_key']),
            'secretConfigured' => filled($settings->secret_key),
            'status'           => $settings->enabled ? ($configured ? 'active' : 'incomplete') : 'disabled',
        ]);
    }

    public function update(Request $request, SpamProtectionSettings $settings)
    {
        $data = $request->validate([
            'enabled'          => ['required', 'boolean'],
            'site_key'         => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-z0-9_-]+$/D'],
            'secret_key'       => ['nullable', 'string', 'max:2048'],
            'clear_secret_key' => ['required', 'boolean'],
        ]);
        $siteKey  = trim($data['site_key'] ?? '');
        $provided = trim($data['secret_key'] ?? '');
        $secret   = $data['clear_secret_key'] ? '' : ($provided !== '' ? $provided : $settings->secret_key);
        if ($data['enabled'] && ($siteKey === '' || $secret === '')) {
            throw ValidationException::withMessages([$siteKey === '' ? 'site_key' : 'secret_key' => 'Add both Turnstile keys before enabling spam protection.']);
        }
        $settings->fill(['enabled' => $data['enabled'], 'site_key' => $siteKey, 'secret_key' => $secret])->save();

        return to_route('admin.settings.protection.edit')->with('settings_saved', true);
    }
}
