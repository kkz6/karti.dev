<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;

uses(RefreshDatabase::class);

test('taxonomy editors save their fields and SEO and stay open', function (string $resource, string $model, string $prop) {
    $this->actingAs(User::factory()->create());
    $payload = [
        'name'       => 'Travel', 'slug' => 'travel', 'description' => 'Travel stories',
        'meta_title' => null, 'meta_description' => null,
        'seo'        => ['title' => 'Travel notes', 'description' => 'Stories from the road', 'author' => 'Karthick'],
    ];
    $response = $this->post(route("admin.{$resource}.store"), $payload);
    $response->assertSessionHasNoErrors();
    $entry = $model::firstOrFail();
    $key   = $resource === 'tags' ? $entry->id : $entry->slug;
    $response->assertRedirect(route("admin.{$resource}.edit", $key));
    expect($entry->seo->title)->toBe('Travel notes');

    $this->get(route("admin.{$resource}.edit", $key))->assertInertia(fn (Assert $page) => $page
        ->component("blog::{$resource}/edit")->where("{$prop}.seo.author", 'Karthick'));

    $this->put(route("admin.{$resource}.update", $key), [...$payload, 'name' => 'Journeys', 'slug' => 'journeys', 'seo' => ['title' => 'Journey notes']])
        ->assertSessionHasNoErrors()->assertRedirect(route("admin.{$resource}.edit", $resource === 'tags' ? $entry->id : 'journeys'));
    expect($entry->fresh()->name)->toBe('Journeys');
    expect($entry->fresh()->seo->title)->toBe('Journey notes');
})->with([
    ['categories', Category::class, 'category'],
    ['tags', Tag::class, 'tag'],
]);

test('taxonomy duplicate slugs return field errors instead of failing to save', function (string $resource, string $model) {
    $this->actingAs(User::factory()->create());
    $model::create(['name' => 'Existing', 'slug' => 'existing']);
    $entry   = $model::create(['name' => 'Second', 'slug' => 'second']);
    $payload = ['name' => 'New', 'slug' => 'existing', 'description' => null, 'meta_title' => null, 'meta_description' => null];
    $this->post(route("admin.{$resource}.store"), $payload)->assertSessionHasErrors('slug');
    $this->put(route("admin.{$resource}.update", $resource === 'tags' ? $entry->id : $entry->slug), $payload)->assertSessionHasErrors('slug');
    expect($entry->fresh()->slug)->toBe('second');
})->with([
    ['categories', Category::class],
    ['tags', Tag::class],
]);
