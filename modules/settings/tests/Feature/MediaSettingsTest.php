<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Media\Jobs\RebuildResponsiveImages;
use Modules\Settings\Settings\MediaSettings;

uses(RefreshDatabase::class);

it('exposes current code-managed compression defaults as read-only settings', function () {
    $this->actingAs(User::factory()->create());
    config()->set('mediable.image_optimization.enabled', false);
    config()->set('mediable.image_optimization.optimizers', [
        \Spatie\ImageOptimizer\Optimizers\Jpegoptim::class => ['--max=72'],
    ]);

    $this->get(route('admin.settings.media.edit'))->assertInertia(fn (Assert $page) => $page
        ->component('settings/media')->missing('settings')
        ->where('mediaSettings.compression.enabled', false)
        ->where('mediaSettings.compression.encodingQuality', 90)
        ->where('mediaSettings.compression.optimizers', [['name' => 'Jpegoptim', 'options' => ['--max=72']]])
        ->where('mediaSettings.builtInNames', ['thumb', 'card', 'content'])
        ->where('mediaSettings.presets', MediaSettings::defaultPresets())
        ->where('mediaSettings.legacyConversions', [['name' => 'thumb', 'width' => 240], ['name' => 'card', 'width' => 600]])
    );

    $this->put(route('admin.settings.media.update'), [
        'presets'     => MediaSettings::defaultPresets(),
        'compression' => ['enabled' => true, 'encodingQuality' => 10],
    ])->assertSessionHasNoErrors();

    expect(config('mediable.image_optimization.enabled'))->toBeFalse();
    expect(app(MediaSettings::class)->refresh()->toArray())->not->toHaveKey('compression');
});

it('rejects edits to built-in dimensions compression and fit without changing saved settings', function ($field, $value) {
    $this->actingAs(User::factory()->create());
    $presets            = MediaSettings::defaultPresets();
    $presets[0][$field] = $value;

    $this->putJson(route('admin.settings.media.update'), ['presets' => $presets])
        ->assertUnprocessable()->assertJsonValidationErrors('presets.0.name');
    expect(app(MediaSettings::class)->refresh()->presets)->toBe(MediaSettings::defaultPresets());
})->with([['width', 480], ['height', 320], ['quality', 70], ['format', 'jpg'], ['fit', 'cover']]);

it('preserves existing built-in values while custom sizes are added changed and removed', function () {
    $this->actingAs(User::factory()->create());
    $core             = MediaSettings::defaultPresets();
    $core[0]['width'] = 400;
    app(MediaSettings::class)->fill(['presets' => $core])->save();
    $custom = ['name' => 'hero', 'width' => 1920, 'height' => null, 'fit' => 'contain', 'format' => 'webp', 'quality' => 85];

    foreach ([$custom, [...$custom, 'width' => 1600]] as $size) {
        $this->put(route('admin.settings.media.update'), ['presets' => [...$core, $size]])->assertSessionHasNoErrors();
        expect(app(MediaSettings::class)->refresh()->presets)->toBe([...$core, $size]);
    }
    $this->put(route('admin.settings.media.update'), ['presets' => $core])->assertSessionHasNoErrors();
    expect(app(MediaSettings::class)->refresh()->presets)->toBe($core);
});

it('protects image settings and rebuild operations', function () {
    $this->get(route('admin.settings.media.edit'))->assertRedirect(route('login'));
    $this->putJson(route('admin.settings.media.update'), ['presets' => MediaSettings::defaultPresets()])->assertUnauthorized();
    $this->postJson(route('admin.settings.media.rebuild'))->assertUnauthorized();
});

it('saves extra named sizes and queues a rebuild only when requested', function () {
    Queue::fake();
    $this->actingAs(User::factory()->create());
    $presets = [...MediaSettings::defaultPresets(), ['name' => 'hero', 'width' => 1920, 'height' => 1080, 'fit' => 'cover', 'format' => 'webp', 'quality' => 85]];
    $this->put(route('admin.settings.media.update'), ['presets' => $presets])->assertSessionHasNoErrors()->assertRedirect(route('admin.settings.media.edit'));
    expect(app(MediaSettings::class)->refresh()->presets)->toBe($presets);
    Queue::assertNothingPushed();
    $this->post(route('admin.settings.media.rebuild'))->assertRedirect(route('admin.settings.media.edit'))->assertSessionHas('media_message');
    Queue::assertPushed(RebuildResponsiveImages::class);
});

it('validates image size limits and safe unique names', function ($field, $value) {
    $this->actingAs(User::factory()->create());
    $presets            = MediaSettings::defaultPresets();
    $presets[0][$field] = $value;
    $this->putJson(route('admin.settings.media.update'), ['presets' => $presets])->assertUnprocessable();
})->with([['name', '../file'], ['name', 'card'], ['width', 4000], ['quality', 120], ['format', 'php'], ['fit', 'stretch']]);

it('requires core sizes and a height for cropping', function () {
    $this->actingAs(User::factory()->create());
    $presets           = MediaSettings::defaultPresets();
    $presets[0]['fit'] = 'cover';
    $this->putJson(route('admin.settings.media.update'), ['presets' => $presets])->assertUnprocessable()->assertJsonValidationErrors('presets.0.height');
    $this->putJson(route('admin.settings.media.update'), ['presets' => array_slice($presets, 1)])->assertUnprocessable();
});
