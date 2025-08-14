<?php

namespace Modules\Media\Providers;

use Illuminate\Contracts\Container\Container;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\DriverInterface;
use Modules\Media\SourceAdapters\SourceAdapterFactory;
use Modules\Media\Support\ImageManipulator;
use Modules\Media\Support\ImageOptimizer;
use Modules\Media\Support\MediaMover;
use Modules\Media\Support\MediaUploader;
use Modules\Media\UrlGenerators\UrlGeneratorFactory;

class MediaServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            dirname(__DIR__).'/../config/mediable.php',
            'mediable'
        );

        $this->registerSourceAdapterFactory();
        $this->registerImageManipulator();
        $this->registerUploader();
        $this->registerMover();
        $this->registerUrlGeneratorFactory();
    }

    public function boot(): void {}

    /**
     * Bind an instance of the Source Adapter Factory to the container.
     *
     * Attaches the default adapter types
     */
    public function registerSourceAdapterFactory(): void
    {
        $this->app->singleton('mediable.source.factory', function (Container $app) {
            $factory = new SourceAdapterFactory;

            $classAdapters = $app['config']->get('mediable.source_adapters.class', []);
            foreach ($classAdapters as $source => $adapter) {
                $factory->setAdapterForClass($adapter, $source);
            }

            $patternAdapters = $app['config']->get('mediable.source_adapters.pattern', []);
            foreach ($patternAdapters as $source => $adapter) {
                $factory->setAdapterForPattern($adapter, $source);
            }

            return $factory;
        });
        $this->app->alias('mediable.source.factory', SourceAdapterFactory::class);
    }

    /**
     * Bind the Media Uploader to the container.
     */
    public function registerUploader(): void
    {
        $this->app->bind('mediable.uploader', function (Container $app) {
            return new MediaUploader(
                $app['filesystem'],
                $app['mediable.source.factory'],
                $app[ImageManipulator::class],
                $app['config']->get('mediable')
            );
        });
        $this->app->alias('mediable.uploader', MediaUploader::class);
    }

    /**
     * Bind the Media Uploader to the container.
     */
    public function registerMover(): void
    {
        $this->app->bind('mediable.mover', function (Container $app) {
            return new MediaMover($app['filesystem']);
        });
        $this->app->alias('mediable.mover', MediaMover::class);
    }

    /**
     * Bind the Media Uploader to the container.
     */
    public function registerUrlGeneratorFactory(): void
    {
        $this->app->singleton('mediable.url.factory', function (Container $app) {
            $factory = new UrlGeneratorFactory;

            $config = $app['config']->get('mediable.url_generators', []);
            foreach ($config as $driver => $generator) {
                $factory->setGeneratorForFilesystemDriver($generator, $driver);
            }

            return $factory;
        });
        $this->app->alias('mediable.url.factory', UrlGeneratorFactory::class);
    }

    public function registerImageManipulator(): void
    {
        $this->app->singleton(ImageManipulator::class, function (Container $app) {
            return new ImageManipulator(
                $this->getInterventionImageManagerConfiguration($app),
                $app->get(FilesystemManager::class),
                $app->get(ImageOptimizer::class)
            );
        });
    }

    private function getInterventionImageManagerConfiguration(Container $app): ?ImageManager
    {
        $imageManager = null;
        if ($app->has(ImageManager::class)
            || (
                class_exists(DriverInterface::class) // intervention >= 3.0
                && $app->has(DriverInterface::class)
            )
        ) {
            // use whatever the user has bound to the container if available
            $imageManager = $app->get(ImageManager::class);
        } elseif (extension_loaded('imagick')) {
            // attempt to automatically configure for imagick
            if (class_exists(\Intervention\Image\Drivers\Imagick\Driver::class)) {
                // intervention/image >=3.0
                $imageManager = new ImageManager(
                    new \Intervention\Image\Drivers\Imagick\Driver
                );
            } else {
                // intervention/image <3.0
                $imageManager = new ImageManager(['driver' => 'imagick']);
            }
        } elseif (extension_loaded('gd')) {
            // attempt to automatically configure for gd
            if (class_exists(\Intervention\Image\Drivers\Gd\Driver::class)) {
                // intervention/image >=3.0
                $imageManager = new ImageManager(
                    new \Intervention\Image\Drivers\Gd\Driver
                );
            } else {
                // intervention/image <3.0
                $imageManager = new ImageManager(['driver' => 'gd']);
            }
        }

        return $imageManager;
    }
}
