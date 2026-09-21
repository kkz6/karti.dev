<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Media\Http\Resources\MediaResource;
use Modules\Media\Jobs\GenerateResponsiveImages;
use Modules\Media\Models\Media;
use Modules\Media\Support\PublicImageSources;
use Modules\Media\Support\ResponsiveImages;
use Modules\Settings\Settings\MediaSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Queue::fake();
    config(['filesystems.default' => 'public', 'mediable.default_disk' => 'public']);
});

function responsiveTestImage(string $name = 'landscape', int $width = 1200, int $height = 800): Media
{
    $image = UploadedFile::fake()->image($name.'.jpg', $width, $height);
    Storage::disk('public')->put('photos/'.$name.'.jpg', $image->getContent());

    return Media::forceCreate([
        'disk'      => 'public', 'directory' => 'photos', 'filename' => $name, 'extension' => 'jpg',
        'mime_type' => 'image/jpeg', 'aggregate_type' => 'image', 'size' => $image->getSize(),
    ]);
}

it('queues all sizes without decoding the original in the upload request or recursive variants', function () {
    $image   = responsiveTestImage();
    expect($image->fresh()->findVariant('thumb'))->toBeNull()->and(Media::count())->toBe(1);
    Queue::assertPushed(GenerateResponsiveImages::class, 1);
    (new GenerateResponsiveImages($image->id))->handle(app(ResponsiveImages::class));
    $variant = $image->fresh()->findVariant('thumb');
    expect($variant)->not->toBeNull()
        ->and($variant->extension)->toBe('webp')
        ->and($variant->custom_properties['width'])->toBe(320)
        ->and($variant->custom_properties['height'])->toBe(213)
        ->and(Media::count())->toBe(4);
    Queue::assertPushed(GenerateResponsiveImages::class, 1);
    $original = Storage::disk('public')->get($image->getDiskPath());
    (new GenerateResponsiveImages($image->id))->handle(app(ResponsiveImages::class));
    expect(Media::count())->toBe(4)
        ->and(Storage::disk('public')->get($image->getDiskPath()))->toBe($original);
    (new GenerateResponsiveImages($image->id))->handle(app(ResponsiveImages::class));
    expect(Media::count())->toBe(4);
});

it('includes separate preview and original URLs immediately after upload', function () {
    $this->actingAs(User::factory()->create());
    $response = $this->postJson('/admin/media', ['disk' => 'public', 'path' => '/', 'file' => UploadedFile::fake()->image('upload.jpg', 1200, 800)])
        ->assertOk()->assertJsonStructure([['url', 'thumbnail_url', 'image_urls' => ['thumb', 'card', 'content']]]);
    expect($response->json('0.thumbnail_url'))->not->toBe($response->json('0.url'));
    $this->getJson('/admin/media')->assertOk()->assertJsonCount(1, 'media');
});

it('generates a missing legacy thumbnail through a signed URL without exposing originals', function () {
    $image = Media::withoutEvents(fn () => responsiveTestImage());
    $url   = $image->imageUrl('thumb');
    expect($url)->not->toBe($image->getUrl());
    $this->get($url)->assertOk()->assertHeader('Content-Type', 'image/webp');
    expect($image->fresh()->findVariant('thumb'))->not->toBeNull();
    $this->get(route('media.image', ['media' => $image->id, 'preset' => 'thumb']))->assertForbidden();
    $this->get(str_replace('/thumb?', '/content?', $url))->assertForbidden();
});

it('respects custom crop settings and does not upscale small images', function () {
    $settings          = app(MediaSettings::class);
    $settings->presets = [...$settings->presets, ['name' => 'square', 'width' => 200, 'height' => 200, 'fit' => 'cover', 'format' => 'png', 'quality' => 80]];
    $settings->save();
    $image  = responsiveTestImage();
    $square = app(ResponsiveImages::class)->generate($image, 'square');
    expect($square->custom_properties)->toBe(['width' => 200, 'height' => 200])
        ->and($square->mime_type)->toBe('image/png');
    expect(app(\Modules\Media\Support\ImageManipulator::class)->getVariantDefinition('square')->shouldOptimize())->toBeFalse();
    $small = app(ResponsiveImages::class)->generate(responsiveTestImage('small', 60, 40), 'thumb');
    expect($small->custom_properties)->toBe(['width' => 60, 'height' => 40]);
});

it('rebuilds thumbnails after replacing an original and uses a new cache-safe URL', function () {
    $image  = responsiveTestImage();
    (new GenerateResponsiveImages($image->id))->handle(app(ResponsiveImages::class));
    $before = $image->fresh()->findVariant('thumb');
    Storage::disk('public')->put($image->getDiskPath(), UploadedFile::fake()->image('new.jpg', 900, 900)->getContent());
    $image->saveConversions(force: true);
    (new GenerateResponsiveImages($image->id, force: true))->handle(app(ResponsiveImages::class));
    $after = $image->fresh()->findVariant('thumb');
    expect($after->id)->toBe($before->id)
        ->and($after->getUrl())->not->toBe($before->getUrl())
        ->and($after->custom_properties)->toBe(['width' => 320, 'height' => 320]);
    Storage::disk('public')->assertMissing($before->getDiskPath());
});

it('uses optimized article images without changing external images or full-size preview targets', function () {
    $image  = responsiveTestImage();
    $html   = '<p>Travel — 日本</p><img src="'.$image->getUrl().'" alt="Landscape"><img src="https://external.example/photo.jpg">';
    $result = app(PublicImageSources::class)->html($html);
    expect($result)->toContain('data-full-src="'.$image->getUrl().'"', 'loading="lazy"', 'Travel — 日本', 'https://external.example/photo.jpg')
        ->not->toContain('<img src="'.$image->getUrl().'"');
});

it('resolves article images from the configured cloud media disk', function () {
    Storage::fake('s3');
    config([
        'filesystems.disks.s3.url' => 'https://media.example.test/site-assets',
        'mediable.default_disk'    => 's3',
        'mediable.allowed_disks'   => ['public', 's3'],
    ]);
    Storage::disk('s3')->put('blog/cloud-image.jpg', UploadedFile::fake()->image('cloud-image.jpg', 1200, 800)->getContent());
    $image = Media::withoutEvents(fn () => Media::forceCreate([
        'disk'      => 's3', 'directory' => 'blog', 'filename' => 'cloud-image', 'extension' => 'jpg',
        'mime_type' => 'image/jpeg', 'aggregate_type' => 'image', 'size' => 100,
    ]));

    $html   = '<p>Cloud image</p><img src="'.$image->getUrl().'" alt="Cloud">';
    $result = app(PublicImageSources::class)->html($html);

    expect(app(PublicImageSources::class)->mediaForUrls([$image->getUrl()])[$image->getUrl()]->is($image))->toBeTrue()
        ->and($result)->toContain('data-full-src="'.$image->getUrl().'"', 'loading="lazy"')
        ->not->toContain('<img src="'.$image->getUrl().'"');
});

it('keeps original URLs for large previews and exposes named variants', function () {
    $image = responsiveTestImage();
    $data  = (new MediaResource($image))->resolve();
    expect($data['preview'])->toBe($image->getUrl())
        ->and($data['url'])->toBe($image->getUrl())
        ->and($data['image_urls']['thumb'])->toBe($data['thumbnail_url']);
});

it('does not attempt raster conversions for documents and SVGs', function () {
    Media::forceCreate(['disk' => 'public', 'directory' => '', 'filename' => 'document', 'extension' => 'pdf', 'mime_type' => 'application/pdf', 'aggregate_type' => 'document', 'size' => 100]);
    Queue::assertNothingPushed();
});
