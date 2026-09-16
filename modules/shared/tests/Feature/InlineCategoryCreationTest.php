<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Category;
use Modules\Tools\Models\ToolCategory;

uses(RefreshDatabase::class);

dataset('inline category endpoints', [
    ['admin.categories.store', Category::class],
    ['admin.tool-categories.store', ToolCategory::class],
]);

test('inline creation returns the saved category without navigating away', function (string $routeName, string $model) {
    $this->actingAs(User::factory()->create());
    $response = $this->postJson(route($routeName), [
        'name'        => 'Development', 'slug' => 'development',
        'description' => null, 'meta_title' => null, 'meta_description' => null,
        'is_active'   => false, 'sort_order' => 999,
    ])->assertCreated()->assertJsonPath('category.name', 'Development')->assertJsonPath('category.slug', 'development');

    $category = $model::findOrFail($response->json('category.id'));
    expect($category->is_active)->toBeTrue();
    expect($category->sort_order)->toBe(0);
    expect(Category::count() + ToolCategory::count())->toBe(1);
    $this->assertDatabaseCount('tools', 0);
    $this->assertDatabaseCount('articles', 0);
})->with('inline category endpoints');

test('inline category errors are returned as field validation errors', function (string $routeName, string $model) {
    $this->actingAs(User::factory()->create());
    $model::create(['name' => 'Existing', 'slug' => 'existing']);
    $payload = ['name' => 'Duplicate', 'slug' => 'existing', 'description' => null, 'meta_title' => null, 'meta_description' => null];
    $this->postJson(route($routeName), $payload)->assertUnprocessable()->assertJsonValidationErrors('slug');
    $this->postJson(route($routeName), [...$payload, 'name' => '', 'slug' => ''])->assertUnprocessable()->assertJsonValidationErrors(['name', 'slug']);
    $this->postJson(route($routeName), [...$payload, 'name' => str_repeat('x', 256), 'slug' => str_repeat('x', 256)])->assertUnprocessable()->assertJsonValidationErrors(['name', 'slug']);
    expect($model::count())->toBe(1);
})->with('inline category endpoints');

test('guests cannot create inline categories', function (string $routeName, string $model) {
    $this->postJson(route($routeName), ['name' => 'Not allowed', 'slug' => 'not-allowed'])->assertUnauthorized();
    expect($model::count())->toBe(0);
})->with('inline category endpoints');
