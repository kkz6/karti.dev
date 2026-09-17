<?php

namespace Modules\Media\Models\Traits;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Modules\Media\Jobs\GenerateResponsiveImages;
use Modules\Media\Models\Media;
use Modules\Media\Support\ResponsiveImages;

trait Convertible
{
    protected static function bootConvertible(): void
    {
        static::created(function (Media $model) {
            $model->saveConversions();
        });
    }

    public function variants(): HasMany
    {
        return $this->hasMany(config('media-manager.model'), 'original_media_id');
    }

    public function saveConversions(bool $force = false): void
    {
        app(\Modules\Media\Support\PhotoMetadata::class)->queue($this, $force);
        $images = app(ResponsiveImages::class);
        if (! $images->supports($this) || ! Storage::disk($this->disk)->exists($this->getDiskPath())) {
            return;
        }

        // Keep image decoding/encoding off the upload request, including the small preview.
        GenerateResponsiveImages::dispatch($this->id, $force)->afterCommit();
    }

    public function deleteConversions(): void
    {
        $this->variants()->delete();
    }

    public function getConversionUrlsAttribute()
    {
        return $this->variants->mapWithKeys(function ($variant) {
            return [$variant->variant_name => $variant->getUrl()];
        });
    }

    public function getConversion(string $variantName)
    {
        $variant = $this->findVariant($variantName);

        return $variant ? $variant->getUrl() : null;
    }

    public function imageUrl(string $preset = 'thumb'): string
    {
        return app(ResponsiveImages::class)->url($this, $preset);
    }
}
