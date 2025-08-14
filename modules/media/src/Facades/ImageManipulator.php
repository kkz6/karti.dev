<?php

namespace Modules\Media\Facades;

use Illuminate\Support\Facades\Facade;
use Modules\Media\Models\Media;
use Modules\Media\Support\ImageManipulation;

/**
 * @method static defineVariant(string $variantName, ImageManipulation $manipulation)
 * @method static bool hasVariantDefinition(string $variantName)
 * @method static ImageManipulation getVariantDefinition(string $variantName)
 * @method static Media createImageVariant(Media $media, string $variantName, bool $forceRecreate = false)
 * @method static validateMedia(Media $media)
 */
class ImageManipulator extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ImageManipulator::class;
    }
}
