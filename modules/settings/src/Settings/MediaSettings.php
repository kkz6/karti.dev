<?php

namespace Modules\Settings\Settings;

use Spatie\LaravelSettings\Settings;

class MediaSettings extends Settings
{
    public array $presets;

    public static function group(): string
    {
        return 'media';
    }

    public static function defaultPresets(): array
    {
        return array_map(fn ($name, $width) => [
            'name' => $name, 'width' => $width, 'height' => null,
            'fit'  => 'contain', 'format' => 'webp', 'quality' => 80,
        ], ['thumb', 'card', 'content'], [320, 640, 1280]);
    }
}
