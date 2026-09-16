<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Photography\DTO\PhotoData;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Photography\Models\Photo;
use Modules\Photography\Tables\Photos;

uses(RefreshDatabase::class);

test('gallery SEO is saved and returned to the editor', function () {
    $this->actingAs(User::factory()->create());
    $service = app(PhotoServiceInterface::class);
    $data    = new PhotoData(title: 'Japan', slug: 'japan', description: null, image_ids: [], cover_image: null,
        status: 'draft', featured: false, sort_order: 0, published_at: null, categories: [], seo: ['title' => 'Japan photographs']);
    $photo = $service->createPhoto($data);
    expect($photo->seo->title)->toBe('Japan photographs');
    $data->seo = ['title' => 'Japan gallery', 'author' => 'Karthick'];
    $photo     = $service->updatePhoto($photo, $data);
    expect($photo->seo->title)->toBe('Japan gallery');
    $this->get(route('admin.photography.edit', $photo))->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
        ->component('photography::createOrEdit')->where('photo.seo.author', 'Karthick'));
});

test('publishing a gallery without a date makes it public and preserves its date on later saves', function () {
    $this->travelTo(now()->startOfSecond());
    $service = app(PhotoServiceInterface::class);
    $data    = new PhotoData(title: 'Japan', slug: 'japan', description: null, image_ids: [], cover_image: null,
        status: 'published', featured: false, sort_order: 0, published_at: null, categories: []);
    $photo = $service->createPhoto($data);
    expect($photo->published_at->equalTo(now()))->toBeTrue();
    expect(Photo::published()->whereKey($photo->id)->exists())->toBeTrue();
    $originalDate       = $photo->published_at;
    $data->published_at = $originalDate->toIso8601String();
    $this->travel(1)->day();
    $photo = $service->updatePhoto($photo, $data);
    expect($photo->published_at->equalTo($originalDate))->toBeTrue();

    $data->published_at = now()->addDay()->toIso8601String();
    $photo              = $service->updatePhoto($photo, $data);
    expect(Photo::published()->whereKey($photo->id)->exists())->toBeFalse();
    $data->published_at = null;
    $photo              = $service->updatePhoto($photo, $data);
    expect($photo->published_at->equalTo(now()))->toBeTrue();
    expect(Photo::published()->whereKey($photo->id)->exists())->toBeTrue();
    $data->status       = 'draft';
    $data->published_at = null;
    $photo              = $service->updatePhoto($photo, $data);
    expect(Photo::published()->whereKey($photo->id)->exists())->toBeFalse();
});

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

test('legacy photography URLs redirect to the editor by slug', function () {
    authenticatedPhotographyUser();
    $photo = createPhotoGallery();

    $this->get(route('admin.photography.show', $photo->slug))
        ->assertRedirect(route('admin.photography.edit', $photo));
});

test('authenticated users can view and edit a photography gallery by numeric ID', function () {
    authenticatedPhotographyUser();
    $photo = createPhotoGallery();

    $this->get(route('admin.photography.show', $photo->id))
        ->assertRedirect(route('admin.photography.edit', $photo));

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
        ->toBe(route('admin.photography.edit', $photo->id));
    expect($table->getColumnByAttribute('title')?->resolveUrl($photo))
        ->toBe(route('admin.photography.edit', $photo->id));
    expect($table->actions()[0]->resolveUrl($photo))
        ->toBe(route('admin.photography.edit', $photo->id));
});
