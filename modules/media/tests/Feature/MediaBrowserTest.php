<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Media\Models\Media;
use Modules\Media\Support\MediaManager;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'filesystems.default'   => 'public',
        'mediable.default_disk' => 'public',
    ]);
    Storage::fake('public');
    $this->actingAs(User::factory()->create());
});

it('opens an empty media library without requiring a blog folder', function () {
    $this->getJson('/admin/media')
        ->assertOk()
        ->assertJsonPath('media', [])
        ->assertJsonPath('subdirectories', [])
        ->assertJsonPath('page_count', 1);

    Storage::disk('public')->assertDirectoryEmpty('/');
});

it('returns a recoverable error for a missing folder and still serves the library root', function () {
    Storage::disk('public')->makeDirectory('photos');

    $this->getJson('/admin/media/blog/content-images')
        ->assertNotFound()
        ->assertJsonPath('code', 'directory_not_found');

    Storage::disk('public')->assertMissing('blog/content-images');

    $this->getJson('/admin/media')
        ->assertOk()
        ->assertJsonPath('subdirectories.0.name', 'photos');
});

it('lists images in an existing nested folder', function () {
    $image = UploadedFile::fake()->image('photo.jpg');
    Storage::disk('public')->put('blog/content-images/photo.jpg', $image->getContent());
    $media = Media::forceCreate([
        'disk'           => 'public',
        'directory'      => 'blog/content-images',
        'filename'       => 'photo',
        'extension'      => 'jpg',
        'mime_type'      => 'image/jpeg',
        'aggregate_type' => 'image',
        'size'           => $image->getSize(),
    ]);

    $this->getJson('/admin/media/blog/content-images')
        ->assertOk()
        ->assertJsonPath('media.0.id', (string) $media->id)
        ->assertJsonPath('media.0.url', Storage::disk('public')->url('blog/content-images/photo.jpg'));

    $this->getJson('/admin/media/show/'.$media->id)
        ->assertOk()
        ->assertJsonPath('data.id', (string) $media->id)
        ->assertJsonPath('data.url', Storage::disk('public')->url('blog/content-images/photo.jpg'));
});

it('rejects files and missing numeric folder names as directories', function () {
    Storage::disk('public')->put('photo.jpg', 'image contents');

    foreach (['photo.jpg', '0'] as $path) {
        $this->getJson('/admin/media/'.$path)
            ->assertNotFound()
            ->assertJsonPath('code', 'directory_not_found');
    }
});

it('normalizes the root and nested folder paths', function () {
    Storage::disk('public')->makeDirectory('blog/content-images');
    $manager = app(MediaManager::class);

    expect($manager->verifyDirectory('/'))->toBe('')
        ->and($manager->verifyDirectory('/blog/content-images/'))->toBe('blog/content-images');
});

it('uploads to the library root without a pre-created content folder', function () {
    $this->postJson('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => UploadedFile::fake()->image('photo.jpg'),
    ])->assertOk();

    $this->assertDatabaseHas('media', [
        'disk'      => 'public',
        'directory' => '',
        'filename'  => 'photo',
    ]);
    Storage::disk('public')->assertExists('photo.jpg');
});

it('accepts a three megabyte file upload', function () {
    $this->post('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => UploadedFile::fake()->image('three-megabyte.jpg')->size(3 * 1024),
    ])->assertOk();

    $this->assertDatabaseHas('media', [
        'disk'      => 'public',
        'directory' => '',
        'filename'  => 'three-megabyte',
        'extension' => 'jpg',
        'size'      => 3 * 1024 * 1024,
    ]);
});

it('reports a useful error when a file name already exists in the folder', function () {
    $this->post('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => UploadedFile::fake()->image('duplicate.jpg'),
    ])->assertOk();

    $this->post('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => UploadedFile::fake()->image('duplicate.jpg'),
    ])
        ->assertConflict()
        ->assertJsonPath('message', "A file named 'duplicate.jpg' already exists in this folder.");
});

it('reports the upload limit when a file is too large', function () {
    $this->post('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => UploadedFile::fake()->image('too-large.jpg')->size(26 * 1024),
    ])
        ->assertStatus(413)
        ->assertJsonPath('message', 'This file exceeds the 25 MB upload limit.');
});
