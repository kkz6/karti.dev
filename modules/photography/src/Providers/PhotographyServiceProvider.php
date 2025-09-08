<?php

namespace Modules\Photography\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Photography\Interfaces\PhotoCollectionRepositoryInterface;
use Modules\Photography\Interfaces\PhotoCollectionServiceInterface;
use Modules\Photography\Interfaces\PhotoRepositoryInterface;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Photography\Repositories\PhotoCollectionRepository;
use Modules\Photography\Repositories\PhotoRepository;
use Modules\Photography\Services\PhotoCollectionService;
use Modules\Photography\Services\PhotoService;

class PhotographyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->bindRepositories();
        $this->bindServices();
    }

    /**
     * Bind repository interfaces to implementations.
     */
    private function bindRepositories(): void
    {
        $this->app->bind(
            PhotoCollectionRepositoryInterface::class,
            PhotoCollectionRepository::class
        );

        $this->app->bind(
            PhotoRepositoryInterface::class,
            PhotoRepository::class
        );
    }

    /**
     * Bind service interfaces to implementations.
     */
    private function bindServices(): void
    {
        $this->app->bind(
            PhotoCollectionServiceInterface::class,
            PhotoCollectionService::class
        );

        $this->app->bind(
            PhotoServiceInterface::class,
            PhotoService::class
        );
    }

    public function boot(): void {}
}
