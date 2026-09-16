<?php

namespace Modules\Settings\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Http\Requests\UpdateSiteSettingsRequest;
use Modules\Settings\Settings\SiteSettings;

class SiteSettingsController
{
    public function edit(SiteSettings $settings): Response
    {
        return Inertia::render('settings/site', ['settings' => $settings->toArray()]);
    }

    public function update(UpdateSiteSettingsRequest $request, SiteSettings $settings): RedirectResponse
    {
        $settings->fill(array_map(fn ($value) => $value ?? '', $request->validated()))->save();

        return to_route('admin.settings.edit')->with('settings_saved', true);
    }
}
