<?php

declare(strict_types=1);

namespace Modules\Table\Providers;

use Illuminate\Foundation\Application;
use Illuminate\Routing\Middleware\ValidateSignature;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Table\Http\ActionController;
use Modules\Table\Http\ExportController;
use Modules\Table\Http\ViewController;
use Modules\Table\Table;
use Modules\Table\TableMakeCommand;

class TableServiceProvider extends ServiceProvider
{
    /**
     * Register the Inertia Table package.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $publishesMigrationsMethod = method_exists($this, 'publishesMigrations')
                ? 'publishesMigrations'
                : 'publishes';

            $this->{$publishesMigrationsMethod}([
                __DIR__.'/../../database/migrations' => database_path('migrations'),
            ], 'inertia-table-migrations');

            $this->commands(TableMakeCommand::class);
        }

        $this->app->afterResolving(Table::class, static function (Table $table, Application $app): void {
            $table->setRequest($app['request']);
        });

        Route::macro('inertiaTable', function (): void {
            /** @var Router $this */
            $this->as('inertia-tables.')
                ->prefix('/_inertia-tables/{table}/{name}')
                ->group(static function (Router $router): void {
                    // RouteServiceProvider had a default namespace for routes in Laravel < v8.0. This is still supported
                    // in modern Laravel apps. We prefix the controller classes with a backslash to ensure the namespace
                    // is not prepended. This approach works regardless of whether a default namespace is set or not.
                    // @see https://laravel.com/docs/8.x/upgrade#automatic-controller-namespace-prefixing
                    $router->post('/action/{action}/{state?}', '\\'.ActionController::class)
                        ->middleware(ValidateSignature::absolute())
                        ->name('action');

                    $router->get('/export/{export}/{state?}', '\\'.ExportController::class)
                        ->middleware(ValidateSignature::absolute('keys'))
                        ->name('export');

                    $router->post('/async-export/{export}/{state?}', '\\'.ExportController::class)
                        ->middleware(ValidateSignature::absolute('keys'))
                        ->name('async-export');

                    $router->post('/view/{state?}', ['\\'.ViewController::class, 'store'])
                        ->middleware(ValidateSignature::absolute())
                        ->name('view.store');

                    $router->delete('/view/{key}/{state?}', ['\\'.ViewController::class, 'destroy'])
                        ->middleware(ValidateSignature::absolute())
                        ->name('view.destroy');
                });
        });
    }
}
