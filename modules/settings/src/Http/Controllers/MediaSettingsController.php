<?php

namespace Modules\Settings\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Media\Jobs\RebuildResponsiveImages;
use Modules\Media\Support\ImageManipulation;
use Modules\Media\Support\ResponsiveImages;
use Modules\Settings\Http\Requests\UpdateMediaSettingsRequest;
use Modules\Settings\Settings\MediaSettings;

class MediaSettingsController
{
    public function edit(ResponsiveImages $images): Response
    {
        return Inertia::render('settings/media', [
            'mediaSettings' => [
                'presets'           => $images->presets(),
                'builtInNames'      => array_column(MediaSettings::defaultPresets(), 'name'),
                'legacyConversions' => collect(config('media-manager.conversions', []))
                    ->map(fn ($width, string $name) => ['name' => $name, 'width' => (int) $width])
                    ->values()->all(),
                'compression' => [
                    'enabled'         => (bool) config('mediable.image_optimization.enabled', true),
                    'encodingQuality' => ImageManipulation::make(static fn () => null)->getOutputQuality(),
                    'optimizers'      => collect(config('mediable.image_optimization.optimizers', []))
                        ->map(fn (array $options, string $class) => ['name' => class_basename($class), 'options' => $options])
                        ->values()->all(),
                ],
            ],
            'mediaMessage' => session('media_message'),
        ]);
    }

    public function update(UpdateMediaSettingsRequest $request, MediaSettings $settings): RedirectResponse
    {
        $settings->fill($request->validated())->save();

        return to_route('admin.settings.media.edit')->with('media_message', 'Image sizes saved. New uploads use these sizes; rebuild to update existing images.');
    }

    public function rebuild(): RedirectResponse
    {
        RebuildResponsiveImages::dispatch();

        return to_route('admin.settings.media.edit')->with('media_message', 'Image regeneration requested. Keep your queue worker running; originals are not changed.');
    }
}
