<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Service;
use Modules\Billing\Support\BillingPermissions;

uses(RefreshDatabase::class);

test('the service catalogue has no registered endpoints or permissions', function () {
    $routes = collect(Route::getRoutes())->filter(fn ($route) => str_starts_with($route->getName() ?? '', 'admin.services.'));
    expect($routes)->toHaveCount(0)
        ->and(array_filter(BillingPermissions::ALL, fn ($permission) => str_ends_with($permission, ' service')))->toBe([])
        ->and(class_exists(\Modules\Billing\Tables\Services::class))->toBeFalse();
});

test('old service URLs cannot read or mutate historical catalogue records even for admins', function (string $method, string $path) {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $service = Service::factory()->create();
    $before  = $service->fresh()->getAttributes();
    $path    = str_replace('{id}', (string) $service->id, $path);
    $this->json($method, $path, ['name'=>'Unexpected change'])->assertNotFound();
    expect($service->fresh()->getAttributes())->toBe($before)->and(Service::count())->toBe(1);
})->with([
    ['GET', '/admin/services'], ['GET', '/admin/services/create'], ['GET', '/admin/services/lookup'],
    ['GET', '/admin/services/{id}'], ['GET', '/admin/services/{id}/edit'], ['POST', '/admin/services'],
    ['PUT', '/admin/services/{id}'], ['PATCH', '/admin/services/{id}'], ['DELETE', '/admin/services/{id}'],
    ['POST', '/admin/services/{id}/archive'], ['POST', '/admin/services/{id}/restore'],
]);
