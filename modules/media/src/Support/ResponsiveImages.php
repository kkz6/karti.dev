<?php

namespace Modules\Media\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Modules\Media\Models\Media;
use Modules\Settings\Settings\MediaSettings;
use Spatie\LaravelSettings\Exceptions\MissingSettings;

class ResponsiveImages
{
    public function presets(): array
    {
        // Resolve at execution time, not provider boot, so queue workers see saved settings.
        try {
            return app(MediaSettings::class)->presets;
        } catch (MissingSettings) {
            return MediaSettings::defaultPresets();
        }
    }

    public function supports(Media $media): bool
    {
        return $media->isOriginal() && in_array($media->mime_type, ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    }

    public function url(Media $media, string $name = 'thumb'): string
    {
        if (! $this->supports($media)) {
            return $media->getUrl();
        }

        $variant = $media->findVariant($name);

        // Legacy images can get a derivative on first view; never download an original as a thumbnail.
        return $variant?->getUrl() ?? URL::signedRoute('media.image', ['media' => $media->id, 'preset' => $name]);
    }

    public function generate(Media $media, string $name, bool $force = false): ?Media
    {
        if (! $this->supports($media)) {
            return null;
        }

        $preset = collect($this->presets())->firstWhere('name', $name);
        if (! $preset) {
            return null;
        }

        return Cache::lock('media-image:'.$media->id, 180)->block(10, function () use ($media, $name, $preset, $force) {
            $media->load('variants');
            if (! $force && $media->hasVariant($name)) {
                return $media->findVariant($name);
            }

            $width        = null;
            $height       = null;
            $manipulation = ImageManipulation::make(function ($image) use ($preset, &$width, &$height) {
                if ($preset['fit'] === 'cover' && $preset['height']) {
                    $image->coverDown($preset['width'], $preset['height']);
                } else {
                    $image->scaleDown(width: $preset['width'], height: $preset['height']);
                }
                $width  = $image->width();
                $height = $image->height();
            })->setOutputFormat($preset['format'])
                ->setOutputQuality($preset['quality'])
                // Encode once at the requested quality; CLI re-encoding can override it (and make PNG lossy).
                ->noOptimization()
                ->matchOriginalVisibility()
                ->toDirectory('conversions/'.$media->id)
                ->useFilename($name.'-'.Str::uuid());

            $manipulator = app(ImageManipulator::class);
            $manipulator->defineVariant($name, $manipulation);
            $variant = $manipulator->createImageVariant($media, $name, $force);
            $variant->forceFill(['custom_properties' => ['width' => $width, 'height' => $height]])->save();
            $media->unsetRelation('variants');

            return $variant;
        });
    }
}
