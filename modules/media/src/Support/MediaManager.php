<?php

declare(strict_types=1);

namespace Modules\Media\Support;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as Gd;
use Intervention\Image\Drivers\Imagick\Driver as Imagick;
use Intervention\Image\Image;
use Intervention\Image\ImageManager;
use Modules\Media\Exceptions\MediaManagerException;
use Modules\Media\Models\Media;
use phpDocumentor\Reflection\Types\ClassString;

class MediaManager
{
    const DRIVER_IMAGICK = Imagick::class;

    const DRIVER_GD = Gd::class;

    const RESIZE_WIDTH = 'widen';

    const RESIZE_HEIGHT = 'heighten';

    public $config;

    public $manager;

    public $media;

    public static $registerRoutes = true;

    /**
     * Constructor.
     *
     * @param ClassString $media
     */
    public function __construct($media = Media::class, ?array $config = null, string $imageDriver = self::DRIVER_IMAGICK)
    {
        $this->config  = $config ?: config('media-manager', []);
        $this->manager = new ImageManager($imageDriver);
        $this->media   = $media;
    }

    /**
     * Takes an image or filename and attempts to change it's size to match the passed size on via the dimension specifed
     * by $method. That is to say it will be $dimension long on $method (height or width) while maintianing aspect ratio
     *
     * @param null   $disk
     * @param string $method
     * @param mixed  $image
     * @param mixed  $dimension
     *
     * @return Image
     *
     * @throws MediaManagerException
     */
    public function resize($image, $dimension, $method = self::RESIZE_WIDTH)
    {
        if ($image instanceof $this->media) {
            $imagePath = $image->getAbsolutePath();
        } else {
            $imagePath = $this->media->whereBasename($image)->firstOrFail()->getAbsolutePath();
        }

        return $this->manager->make($imagePath)->$method($dimension)->save();
    }

    /**
     * Checks that the passed disk exists, and throws an exception if the disk is not accessible or non-existant. if
     * no disk is passed, the default mediable disk is passed instead.
     *
     * @param null $disk
     *
     * @return \Illuminate\Config\Repository|mixed|null
     *
     * @throws MediaManagerException
     */
    public function verifyDisk($disk = null): mixed
    {
        if (! $disk) {
            $disk = config('mediable.default_disk');
        }

        if (is_null(config("filesystems.disks.{$disk}"))) {
            throw MediaManagerException::diskNotFound($disk);
        }

        return $disk;
    }

    /**
     * Checks for the existence of the passed directory on the specified disk.
     *
     *
     * @param string $directory
     *
     * @return string
     * @throws MediaManagerException
     */
    public function verifyDirectory(string $directory): string
    {
        if ($directory && ! Storage::exists($directory)) {
            throw MediaManagerException::directoryNotFound($directory);
        }

        return trim($directory, '/');
    }

    public static function ignoreRoutes()
    {
        static::$registerRoutes = false;

        return new static;
    }
}
