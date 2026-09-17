<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Modules\Auth\Models\User;
use Modules\Media\Http\Resources\MediaResource;
use Modules\Media\Jobs\ExtractPhotoMetadata;
use Modules\Media\Models\Media;
use Modules\Media\Support\PhotoMetadata;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Queue::fake();
    config(['mediable.default_disk' => 'public']);
});

function photoMetadataIfd(array $entries, int $offset): string
{
    $table = pack('v', count($entries));
    $data  = '';
    foreach ($entries as [$tag, $type, $value]) {
        $encoded = match ($type) {
            2 => $value."\0", 3 => pack('v', $value), 4 => pack('V', $value),
            5 => pack('V2', ...$value),
        };
        $count = $type === 2 ? strlen($encoded) : 1;
        $table .= pack('vvV', $tag, $type, $count);
        if (strlen($encoded) > 4) {
            $table .= pack('V', $offset + 2 + count($entries) * 12 + 4 + strlen($data));
            $data .= $encoded;
        } else {
            $table .= str_pad($encoded, 4, "\0");
        }
    }

    return $table.pack('V', 0).$data;
}

function photoMetadataJpeg(): string
{
    $entries       = [[0x010F, 2, 'SONY'], [0x0110, 2, 'ILCE-7M4'], [0x0112, 3, 6], [0x8769, 4, 0]];
    $exifOffset    = 8 + strlen(photoMetadataIfd($entries, 8));
    $entries[3][2] = $exifOffset;
    $exif          = "Exif\0\0II".pack('vV', 42, 8).photoMetadataIfd($entries, 8).photoMetadataIfd([
        [0x829A, 5, [1, 250]], [0x829D, 5, [28, 10]], [0x8827, 3, 400],
        [0x9003, 2, '2026:09:17 08:30:00'], [0x920A, 5, [35, 1]], [0xA434, 2, 'FE 35mm F1.8'],
    ], $exifOffset);
    $jpeg = UploadedFile::fake()->image('photo.jpg', 120, 80)->getContent();

    return substr($jpeg, 0, 2)."\xFF\xE1".pack('n', strlen($exif) + 2).$exif.substr($jpeg, 2);
}

function storedMetadataPhoto(string $bytes): Media
{
    Storage::disk('public')->put('photos/photo.jpg', $bytes);

    return Media::withoutEvents(fn () => Media::forceCreate([
        'disk'              => 'public', 'directory' => 'photos', 'filename' => 'photo', 'extension' => 'jpg',
        'mime_type'         => 'image/jpeg', 'aggregate_type' => 'image', 'size' => strlen($bytes),
        'custom_properties' => ['focus' => '30-50'],
    ]));
}

function runPhotoMetadataJob(Media $media): ExtractPhotoMetadata
{
    $job = Queue::pushed(ExtractPhotoMetadata::class, fn ($job) => $job->mediaId === $media->id)->last();
    expect($job)->not->toBeNull();
    $job->handle(app(PhotoMetadata::class));

    return $job;
}

it('queues uploads and extracts real EXIF in the worker without modifying the original', function () {
    if (! function_exists('exif_read_data')) {
        $this->markTestSkipped('PHP EXIF extension is unavailable.');
    }
    $bytes = photoMetadataJpeg();
    $this->actingAs(User::factory()->create());
    $response = $this->postJson('/admin/media', [
        'disk' => 'public', 'path' => '/', 'file' => UploadedFile::fake()->createWithContent('photo.jpg', $bytes),
    ])->assertOk()->assertJsonPath('0.dimensions', null)->assertJsonPath('0.photo_metadata.status', 'pending');
    $media = Media::findOrFail($response->json('0.id'));
    Queue::assertPushed(ExtractPhotoMetadata::class, 1);
    runPhotoMetadataJob($media);
    $this->getJson(route('media.show', $media->id))->assertOk()
        ->assertJsonPath('data.dimensions', ['width' => 80, 'height' => 120])
        ->assertJsonPath('data.photo_metadata.fields.camera_make', 'SONY')
        ->assertJsonPath('data.photo_metadata.fields.lens', 'FE 35mm F1.8')
        ->assertJsonPath('data.photo_metadata.fields.aperture', 2.8)
        ->assertJsonPath('data.photo_metadata.fields.exposure_seconds', 0.004)
        ->assertJsonPath('data.photo_metadata.fields.iso', 400)
        ->assertJsonPath('data.photo_metadata.fields.taken_at', '2026-09-17 08:30:00');
    expect(Storage::disk('public')->get($media->getDiskPath()))->toBe($bytes);
});

it('allows only safe photo fields and ignores invalid values', function () {
    $fields = app(PhotoMetadata::class)->normalize([
        'GPS'  => ['GPSLatitude' => 'private'],
        'IFD0' => ['Make' => "SONY\0", 'Model' => ['invalid'], 'SerialNumber' => 'private'],
        'EXIF' => ['MakerNote' => 'private', 'UserComment' => 'private', 'FNumber' => '1/0',
            'ISOSpeedRatings'  => -10, 'ExposureTime' => '1/250', 'FocalLength' => '35/1',
            'DateTimeOriginal' => '2026:02:31 08:30:00'],
    ]);
    expect($fields)->toBe(['camera_make' => 'SONY', 'focal_length' => 35.0, 'exposure_seconds' => 0.004]);
});

it('queues older images once on opening details and reuses cached metadata', function () {
    $media      = storedMetadataPhoto(photoMetadataJpeg());
    $modifiedAt = $media->updated_at->toISOString();
    $this->travel(1)->hours();
    $this->actingAs(User::factory()->create());
    $this->getJson(route('media.show', $media->id))->assertOk()->assertJsonPath('data.photo_metadata.status', 'pending');
    $this->getJson(route('media.show', $media->id))->assertOk()->assertJsonPath('data.photo_metadata.status', 'pending');
    Queue::assertPushed(ExtractPhotoMetadata::class, 1);
    runPhotoMetadataJob($media);
    $properties = $media->fresh()->custom_properties;
    expect($properties['focus'])->toBe('30-50')
        ->and($media->fresh()->updated_at->toISOString())->toBe($modifiedAt);
    Storage::disk('public')->delete($media->getDiskPath());
    $this->getJson(route('media.show', $media->id))->assertOk()->assertJsonPath('data.photo_metadata', $properties['photo_metadata']);
});

it('refreshes dimensions and clears stale EXIF after replacing the file', function () {
    $media = storedMetadataPhoto(photoMetadataJpeg());
    app(PhotoMetadata::class)->queue($media);
    runPhotoMetadataJob($media);
    Storage::disk('public')->put($media->getDiskPath(), UploadedFile::fake()->image('new.jpg', 40, 30)->getContent());
    $media->saveConversions(force: true);
    expect($media->fresh()->custom_properties['photo_metadata']['status'])->toBe('pending');
    runPhotoMetadataJob($media);
    expect($media->fresh()->custom_properties['width'])->toBe(40)
        ->and($media->fresh()->custom_properties['height'])->toBe(30)
        ->and($media->fresh()->custom_properties['photo_metadata']['fields'])->toBe([])
        ->and($media->fresh()->custom_properties['focus'])->toBe('30-50');
});

it('keeps EXIF out of anonymous resource responses and requires login for details', function () {
    $media = storedMetadataPhoto(photoMetadataJpeg());
    app(PhotoMetadata::class)->queue($media);
    runPhotoMetadataJob($media);
    expect((new MediaResource($media))->resolve())->not->toHaveKey('photo_metadata');
    $this->getJson(route('media.show', $media->id))->assertUnauthorized();
});

it('handles missing or unreadable files without blocking details', function () {
    $media = storedMetadataPhoto('not an image');
    $this->actingAs(User::factory()->create());
    $this->getJson(route('media.show', $media->id))->assertOk()->assertJsonPath('data.photo_metadata.status', 'pending');
    $job = Queue::pushed(ExtractPhotoMetadata::class)->last();
    expect(fn () => $job->handle(app(PhotoMetadata::class)))->toThrow(RuntimeException::class);
    $job->failed(new RuntimeException('Retries exhausted'));
    $this->getJson(route('media.show', ['id' => $media->id, 'metadata_only' => true]))
        ->assertOk()->assertJsonPath('data.photo_metadata.status', 'error');
    Queue::assertPushed(ExtractPhotoMetadata::class, 1);
});

it('shows dimensions for images without supported EXIF', function () {
    $this->actingAs(User::factory()->create());
    $response = $this->postJson('/admin/media', [
        'disk' => 'public', 'path' => '/', 'file' => UploadedFile::fake()->image('plain.png', 160, 90),
    ])->assertOk()->assertJsonPath('0.photo_metadata.status', 'pending');
    $media = Media::findOrFail($response->json('0.id'));
    runPhotoMetadataJob($media);
    $this->getJson(route('media.show', $media->id))->assertOk()
        ->assertJsonPath('data.dimensions', ['width' => 160, 'height' => 90])
        ->assertJsonPath('data.photo_metadata.status', 'unsupported');
});

it('discards stale results and failures after an image is replaced', function () {
    $media    = storedMetadataPhoto(photoMetadataJpeg());
    $metadata = app(PhotoMetadata::class);
    $metadata->queue($media);
    $oldJob = Queue::pushed(ExtractPhotoMetadata::class)->last();
    $metadata->queue($media, true);
    $newToken = $media->fresh()->custom_properties['photo_metadata']['request_id'];
    $metadata->finish($media->id, $oldJob->requestId, 'available', ['camera_make' => 'Stale'], ['width' => 999]);
    $oldJob->failed(new RuntimeException('Old job failed'));
    $oldJob->handle($metadata);
    expect($media->fresh()->custom_properties['photo_metadata']['request_id'])->toBe($newToken)
        ->and($media->fresh()->custom_properties)->not->toHaveKey('width');
    runPhotoMetadataJob($media);
    expect($media->fresh()->custom_properties['width'])->not->toBe(999);
});

it('preserves property changes made while extraction is queued', function () {
    $media = storedMetadataPhoto(photoMetadataJpeg());
    app(PhotoMetadata::class)->queue($media);
    $properties          = $media->custom_properties;
    $properties['focus'] = '70-80';
    $media->forceFill(['custom_properties' => $properties])->saveQuietly();
    runPhotoMetadataJob($media);
    expect($media->fresh()->custom_properties['focus'])->toBe('70-80');
});

it('recovers stale pending jobs when details are reopened', function () {
    $media = storedMetadataPhoto(photoMetadataJpeg());
    app(PhotoMetadata::class)->queue($media);
    $this->travel(16)->minutes();
    $this->actingAs(User::factory()->create())->getJson(route('media.show', $media->id))->assertOk();
    Queue::assertPushed(ExtractPhotoMetadata::class, 2);
});

it('ignores queued jobs for deleted media', function () {
    $media = storedMetadataPhoto(photoMetadataJpeg());
    app(PhotoMetadata::class)->queue($media);
    $job = Queue::pushed(ExtractPhotoMetadata::class)->last();
    Media::withoutEvents(fn () => $media->delete());
    $job->handle(app(PhotoMetadata::class));
    $job->failed(new RuntimeException('Deleted'));
    expect(Media::find($media->id))->toBeNull();
});
