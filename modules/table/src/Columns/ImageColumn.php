<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Modules\Table\Image;

class ImageColumn extends Column
{
    /**
     * Always return true, as the image column always has an image.
     */
    public function hasImage(): bool
    {
        return true;
    }

    /**
     * Resolve the Image for the given model.
     */
    public function resolveImage(Model $model): string|array|null
    {
        return Image::resolve($model, function (mixed $item, Image $image) {
            $image->url($this->getDataFromItem($item));

            if (($callback = $this->image) instanceof Closure) {
                return $callback($item, $image) ?? $image;
            }

            return $image;
        });
    }
}
