<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Photography\Models\Photo;
use Modules\Photography\Tables\Photos;

uses(RefreshDatabase::class);

function authenticatedPhotographyUser(): User
{
    $user = User::factory()->create();

    test()->actingAs($user);

    return $user;
}

function createPhotoGallery(array $overrides = []): Photo
{
    return Photo::query()->create(array_merge([
        'title'        => 'Japan',
        'slug'         => 'japan',
        'description'  => 'A gallery from Japan.',
        'status'       => 'published',
        'featured'     => true,
        'sort_order'   => 0,
        'published_at' => now(),
    ], $overrides));
}

test('unauthenticated users cannot access the photography index', function () {
    $this->get(route('admin.photography.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view a photography gallery by slug', function () {
    authenticatedPhotographyUser();
    $photo = createPhotoGallery();

    $this->get(route('admin.photography.show', $photo->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('photography::show')
            ->where('collection.id', $photo->id)
            ->where('collection.slug', $photo->slug)
            ->has('collection.photos', 0)
        );
});

test('authenticated users can view and edit a photography gallery by numeric ID', function () {
    authenticatedPhotographyUser();
    $photo = createPhotoGallery();

    $this->get(route('admin.photography.show', $photo->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('photography::show')
            ->where('collection.id', $photo->id)
        );

    $this->get(route('admin.photography.edit', $photo->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('photography::createOrEdit')
            ->where('photo.id', $photo->id)
        );
});

test('photography table links its ID and title to the gallery and its edit action to the edit form', function () {
    $photo = createPhotoGallery();
    $table = Photos::make();

    expect($table->getColumnByAttribute('id')?->resolveUrl($photo))
        ->toBe(route('admin.photography.show', $photo->id));
    expect($table->getColumnByAttribute('title')?->resolveUrl($photo))
        ->toBe(route('admin.photography.show', $photo->id));
    expect($table->actions()[0]->resolveUrl($photo))
        ->toBe(route('admin.photography.edit', $photo->id));
});
