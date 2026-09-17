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

it('creates folders on the media disk and immediately lists them even with a stale cache', function () {
    Storage::fake('local');
    config(['filesystems.default' => 'local', 'mediable.default_disk' => 'public']);
    Storage::disk('public')->makeDirectory('photography/galleries');
    \Illuminate\Support\Facades\Cache::put('media.manager.folders.root.photography.galleries', collect([]), 86400);
    $this->postJson(route('media-manager.create'), ['path' => 'photography/galleries/Japan Images'])
        ->assertOk()->assertJsonPath('success', true)
        ->assertJsonPath('path', 'photography/galleries/Japan Images')->assertJsonPath('disk', 'public');
    expect(Storage::disk('public')->directoryExists('photography/galleries/Japan Images'))->toBeTrue()
        ->and(Storage::disk('local')->directoryExists('photography/galleries/Japan Images'))->toBeFalse();
    $this->getJson('/admin/media/photography/galleries')->assertOk()
        ->assertJsonPath('subdirectories.0.name', 'photography/galleries/Japan Images');
    $this->getJson('/admin/media/photography/galleries/Japan%20Images')->assertOk()
        ->assertJsonPath('media', [])->assertJsonPath('subdirectories', []);
    // A folder created outside the app must not remain hidden behind a cached list either.
    Storage::disk('public')->makeDirectory('photography/galleries/Another');
    $this->getJson('/admin/media/photography/galleries')->assertOk()->assertJsonCount(2, 'subdirectories');
});

it('reports duplicate folders and files without overwriting them', function () {
    Storage::disk('public')->makeDirectory('Existing');
    Storage::disk('public')->put('photo.jpg', 'original');
    foreach (['Existing', 'photo.jpg'] as $path) {
        $this->postJson(route('media-manager.create'), ['path' => $path])->assertConflict()
            ->assertJsonPath('message', 'A file or folder with this name already exists here.');
    }
    expect(Storage::disk('public')->get('photo.jpg'))->toBe('original');
});

it('never reports folder creation success when storage refuses the write', function () {
    $disk = \Mockery::mock(Storage::disk('public'))->makePartial();
    $disk->shouldReceive('makeDirectory')->with('New folder')->once()->andReturn(false);
    Storage::shouldReceive('disk')->with('public')->andReturn($disk);
    $this->postJson(route('media-manager.create'), ['path' => 'New folder'])->assertStatus(503)
        ->assertJsonPath('message', 'Could not create the folder. Check storage permissions and try again.');
});

it('rejects invalid folder paths and missing parents', function (string $path) {
    $this->postJson(route('media-manager.create'), ['path' => $path])->assertUnprocessable();
    Storage::disk('public')->assertDirectoryEmpty('/');
})->with(['/', '../outside', 'a/../b', 'conversions/new', 'missing/child', 'bad\\name', ' ', 'two//parts']);

it('returns the normalized path for a folder with surrounding whitespace', function () {
    $this->postJson(route('media-manager.create'), ['path' => ' New folder '])->assertOk()->assertJsonPath('path', 'New folder');
    expect(Storage::disk('public')->directoryExists('New folder'))->toBeTrue();
});

it('requires authentication to create a folder', function () {
    auth()->logout();
    $this->postJson(route('media-manager.create'), ['path' => 'New folder'])->assertUnauthorized();
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

it('reports the PHP upload limit when PHP rejects a file before validation', function () {
    $file = new UploadedFile(
        UploadedFile::fake()->image('php-limit.jpg')->getPathname(),
        'php-limit.jpg',
        'image/jpeg',
        UPLOAD_ERR_INI_SIZE,
        true,
    );

    $this->post('/admin/media', [
        'disk' => 'public',
        'path' => '/',
        'file' => $file,
    ])
        ->assertStatus(413)
        ->assertJsonPath('message', sprintf('This file exceeds the server upload limit of %s.', ini_get('upload_max_filesize')));
});
