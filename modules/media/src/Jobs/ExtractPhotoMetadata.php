<?php

namespace Modules\Media\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Media\Models\Media;
use Modules\Media\Support\PhotoMetadata;
use Throwable;

class ExtractPhotoMetadata implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public int $mediaId, public string $requestId) {}

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function handle(PhotoMetadata $metadata): void
    {
        $media = Media::find($this->mediaId);
        if (! $media || ($media->custom_properties['photo_metadata']['status'] ?? '') !== 'pending'
            || ($media->custom_properties['photo_metadata']['request_id'] ?? null) !== $this->requestId) {
            return;
        }

        $metadata->capture($media, $this->requestId);
    }

    public function failed(?Throwable $exception): void
    {
        app(PhotoMetadata::class)->finish($this->mediaId, $this->requestId, 'error');
    }
}
