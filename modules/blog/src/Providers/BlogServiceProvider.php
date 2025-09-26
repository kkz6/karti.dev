<?php

namespace Modules\Blog\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Blog\Interfaces\ArticleRepositoryInterface;
use Modules\Blog\Interfaces\ArticleServiceInterface;
use Modules\Blog\Interfaces\CategoryRepositoryInterface;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Interfaces\TagRepositoryInterface;
use Modules\Blog\Interfaces\TagServiceInterface;
use Modules\Blog\Repositories\ArticleRepository;
use Modules\Blog\Repositories\CategoryRepository;
use Modules\Blog\Repositories\TagRepository;
use Modules\Blog\Services\ArticleService;
use Modules\Blog\Services\CategoryService;
use Modules\Blog\Services\TagService;

class BlogServiceProvider extends ServiceProvider
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
            ArticleRepositoryInterface::class,
            ArticleRepository::class
        );

        $this->app->bind(
            CategoryRepositoryInterface::class,
            CategoryRepository::class
        );

        $this->app->bind(
            TagRepositoryInterface::class,
            TagRepository::class
        );
    }

    /**
     * Bind service interfaces to implementations.
     */
    private function bindServices(): void
    {
        $this->app->bind(
            ArticleServiceInterface::class,
            ArticleService::class
        );

        $this->app->bind(
            CategoryServiceInterface::class,
            CategoryService::class
        );

        $this->app->bind(
            TagServiceInterface::class,
            TagService::class
        );
    }

    public function boot(): void
    {
    }

}
