<?php

namespace Modules\Media\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Media\Jobs\ExtractPhotoMetadata;
use Modules\Media\Models\Media;

class PhotoMetadata
{
    public function queue(Media $media, bool $force = false): void
    {
        if (! $media->isOriginal() || $media->aggregate_type !== 'image'
            || ! in_array($media->mime_type, ['image/jpeg', 'image/tiff', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp'])) {
            return;
        }

        DB::transaction(function () use ($media, $force) {
            $current = Media::lockForUpdate()->find($media->id);
            if (! $current) {
                return;
            }
            $properties = $current->custom_properties ?? [];
            $previous   = $properties['photo_metadata'] ?? [];
            if (! $force && ($previous['version'] ?? null) === 1) {
                if (in_array($previous['status'] ?? '', ['available', 'empty', 'unsupported'])) {
                    $media->custom_properties = $properties;

                    return;
                }
                if (($previous['status'] ?? '') === 'pending' && ($previous['queued_at'] ?? 0) > now()->subMinutes(15)->timestamp) {
                    $media->custom_properties = $properties;

                    return;
                }
            }
            $requestId                    = (string) Str::uuid();
            $properties['photo_metadata'] = [
                'version'    => 1, 'status' => 'pending', 'fields' => [],
                'request_id' => $requestId, 'queued_at' => now()->timestamp,
            ];
            if ($force) {
                unset($properties['width'], $properties['height']);
            }
            Media::withoutTimestamps(fn () => $current->forceFill(['custom_properties' => $properties])->saveQuietly());
            $media->custom_properties = $properties;
            ExtractPhotoMetadata::dispatch($media->id, $requestId)->afterCommit();
        }, attempts: 5);
    }

    public function capture(Media $media, string $requestId): void
    {
        if (($media->custom_properties['photo_metadata']['request_id'] ?? null) !== $requestId) {
            return;
        }

        $stream    = null;
        $temporary = null;
        try {
            $disk = Storage::disk($media->disk);
            if (config("filesystems.disks.{$media->disk}.driver") === 'local') {
                $path = $disk->path($media->getDiskPath());
            } else {
                // EXIF needs a seekable stream. Bound remote reads and keep them off listing requests.
                $stream    = $disk->readStream($media->getDiskPath());
                $temporary = tmpfile();
                if (! is_resource($stream) || ! is_resource($temporary)
                    || stream_copy_to_stream($stream, $temporary, 64 * 1024 * 1024 + 1) > 64 * 1024 * 1024) {
                    throw new \RuntimeException('Photo metadata source cannot be read.');
                }
                $path = stream_get_meta_data($temporary)['uri'];
            }

            $dimensions = @getimagesize($path);
            if ($dimensions === false) {
                throw new \RuntimeException('Photo dimensions cannot be read.');
            }
            $fields = [];
            $status = 'unsupported';
            if (in_array($dimensions['mime'], ['image/jpeg', 'image/tiff'])) {
                $status = 'unavailable';
                if (function_exists('exif_read_data')) {
                    $exif   = @exif_read_data($path, null, true, false);
                    $fields = $this->normalize(is_array($exif) ? $exif : []);
                    $status = $fields ? 'available' : 'empty';
                }
            }

            $orientation      = (int) ($fields['orientation'] ?? 1);
            [$width, $height] = in_array($orientation, [5, 6, 7, 8])
                ? [$dimensions[1], $dimensions[0]] : [$dimensions[0], $dimensions[1]];
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
            if (is_resource($temporary)) {
                fclose($temporary);
            }
        }

        $this->finish($media->id, $requestId, $status, $fields, ['width' => $width, 'height' => $height]);
    }

    public function finish(int $mediaId, string $requestId, string $status, array $fields = [], array $dimensions = []): void
    {
        DB::transaction(function () use ($mediaId, $requestId, $status, $fields, $dimensions) {
            $media      = Media::lockForUpdate()->find($mediaId);
            $properties = $media?->custom_properties ?? [];
            // A replacement may have been queued while this worker was reading the old file.
            if (! $media || ($properties['photo_metadata']['request_id'] ?? null) !== $requestId
                || ($properties['photo_metadata']['status'] ?? '') !== 'pending') {
                return;
            }
            $properties                   = array_replace($properties, $dimensions);
            $properties['photo_metadata'] = ['version' => 1, 'status' => $status, 'fields' => $fields];
            Media::withoutTimestamps(fn () => $media->forceFill(['custom_properties' => $properties])->saveQuietly());
        });
    }

    /** Keep only reusable photo fields, never GPS, serial numbers, comments or maker notes. */
    public function normalize(array $exif): array
    {
        $ifd    = $exif['IFD0'] ?? [];
        $photo  = $exif['EXIF'] ?? [];
        $fields = [];
        foreach (['camera_make' => $ifd['Make'] ?? null, 'camera_model' => $ifd['Model'] ?? null,
            'lens'              => $photo['LensModel'] ?? $photo['UndefinedTag:0xA434'] ?? null] as $key => $value) {
            if (is_string($value)) {
                $value = trim(preg_replace('/[\x00-\x1F\x7F]/u', '', mb_convert_encoding($value, 'UTF-8', 'UTF-8')) ?? '');
                if ($value !== '') {
                    $fields[$key] = mb_substr($value, 0, 200);
                }
            }
        }

        foreach (['aperture'   => $photo['FNumber'] ?? null, 'focal_length' => $photo['FocalLength'] ?? null,
            'exposure_seconds' => $photo['ExposureTime'] ?? null, 'iso' => $photo['ISOSpeedRatings'] ?? null] as $key => $value) {
            $number = $this->number($value);
            if ($number !== null && $number > 0) {
                $fields[$key] = $number;
            }
        }

        $orientation = $ifd['Orientation'] ?? null;
        if (is_numeric($orientation) && in_array((int) $orientation, range(1, 8))) {
            $fields['orientation'] = (int) $orientation;
        }

        $takenAt = $photo['DateTimeOriginal'] ?? null;
        if (is_string($takenAt)) {
            $date = \DateTimeImmutable::createFromFormat('!Y:m:d H:i:s', $takenAt);
            if ($date && $date->format('Y:m:d H:i:s') === $takenAt) {
                // Camera-local time: do not invent a timezone or convert it to UTC.
                $fields['taken_at'] = $date->format('Y-m-d H:i:s');
            }
        }

        return $fields;
    }

    private function number(mixed $value): ?float
    {
        if (is_string($value) && preg_match('/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/', $value, $parts)) {
            return (float) $parts[2] > 0 ? (float) $parts[1] / (float) $parts[2] : null;
        }

        return is_numeric($value) && is_finite((float) $value) ? (float) $value : null;
    }
}
