<?php

namespace Modules\Media\Models\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Media\Jobs\CreateImageVariants;

trait Convertible
{
    protected static function bootConvertible(): void
    {
        static::saved(function (Model $model) {
            if (config('media-manager.use-conversions')) {
                $model->saveConversions();
            }
        });

        static::deleted(function (Model $model) {
            if (config('media-manager.use-conversions')) {
                $model->deleteConversions();
            }
        });
    }

    public function variants(): HasMany
    {
        return $this->hasMany(config('media-manager.model'), 'original_media_id');
    }

    public function saveConversions(): void
    {
        $conversions = config('media-manager.conversions', []);
        $variantNames = array_keys($conversions);

        if (! empty($variantNames)) {
            CreateImageVariants::dispatch($this, $variantNames, false);
        }
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
        $variant = $this->variants()->where('variant_name', $variantName)->first();

        return $variant ? $variant->getUrl() : null;
    }
}
