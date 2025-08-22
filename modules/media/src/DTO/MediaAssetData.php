<?php

namespace Modules\Media\DTO;

use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Data;

class MediaAssetData extends Data
{
    public function __construct(
        public int $id,
        public string $disk,
        public string $directory,
        public string $filename,
        public ?string $alt,
        public string $extension,
        public string $mime_type,
        public string $aggregate_type,
        public int $size,
        public ?string $variant_name,
        public ?int $original_media_id,
        public string $created_at,
        public string $updated_at,
        public ?string $title = null,
        public ?string $credit = null,
        public ?string $caption = null,
        public ?string $focus = null,
    ) {}

    public static function fromModel(Media $media): self
    {
        return new self(
            id: $media->id,
            disk: $media->disk,
            directory: $media->directory,
            filename: $media->filename,
            alt: $media->alt,
            extension: $media->extension,
            mime_type: $media->mime_type,
            aggregate_type: $media->aggregate_type,
            size: $media->size,
            variant_name: $media->variant_name,
            original_media_id: $media->original_media_id,
            created_at: $media->created_at->toISOString(),
            updated_at: $media->updated_at->toISOString(),
            title: $media->title ?? $media->filename,
            credit: $media->credit,
            caption: $media->caption,
            focus: $media->focus, // This will use the accessor from custom_properties
        );
    }

    #[Computed]
    public function getIsImage(): bool
    {
        return $this->aggregate_type === 'image';
    }

    #[Computed]
    public function getIsAudio(): bool
    {
        return $this->aggregate_type === 'audio';
    }

    #[Computed]
    public function getIsVideo(): bool
    {
        return $this->aggregate_type === 'video';
    }

    #[Computed]
    public function getUrl(): string
    {
        if ($this->disk === 'public') {
            return url('storage/' . $this->getFullPath());
        }

        // For other disks, you might need to implement signed URLs or other methods
        return Storage::disk($this->disk)->path($this->getFullPath());
    }

    #[Computed]
    public function getThumbnailUrl(): ?string
    {
        if (! $this->getIsImage()) {
            return null;
        }

        // For images, we can return the same URL as thumbnail for now
        // Later you can implement proper thumbnail generation
        return $this->getUrl();
    }

    #[Computed]
    public function getPreviewUrl(): ?string
    {
        if ($this->getIsImage()) {
            return $this->getUrl();
        }

        // For other file types, return null or a default preview
        return null;
    }

    #[Computed]
    public function getPath(): string
    {
        $fullFilename = $this->filename . '.' . $this->extension;

        return $this->directory ? $this->directory . '/' . $fullFilename : $fullFilename;
    }

    #[Computed]
    public function getFullPath(): string
    {
        $fullFilename = $this->filename . '.' . $this->extension;

        return $this->directory ? $this->directory . '/' . $fullFilename : $fullFilename;
    }

    #[Computed]
    public function getFormattedSize(): string
    {
        $bytes = $this->size;
        if ($bytes === 0) {
            return '0 Bytes';
        }

        $k     = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB'];
        $i     = floor(log($bytes) / log($k));

        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }

    #[Computed]
    public function getDimensions(): ?array
    {
        if (! $this->getIsImage()) {
            return null;
        }

        // You can implement proper dimension extraction here
        // For now, return null and handle it in the frontend
        return null;
    }

    public function toArray(): array
    {
        return [
            'id'                => (string) $this->id,
            'disk'              => $this->disk,
            'directory'         => $this->directory,
            'filename'          => $this->filename,
            'title'             => $this->title,
            'alt'               => $this->alt,
            'extension'         => $this->extension,
            'mime_type'         => $this->mime_type,
            'aggregate_type'    => $this->aggregate_type,
            'size'              => $this->size,
            'variant_name'      => $this->variant_name,
            'original_media_id' => $this->original_media_id,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
            'credit'            => $this->credit,
            'caption'           => $this->caption,
            'focus'             => $this->focus,
            'container_id'      => $this->disk, // Use disk as container_id for now

            // Computed properties
            'is_image'       => $this->getIsImage(),
            'is_audio'       => $this->getIsAudio(),
            'is_video'       => $this->getIsVideo(),
            'url'            => $this->getUrl(),
            'thumbnail_url'  => $this->getThumbnailUrl(),
            'preview'        => $this->getPreviewUrl(),
            'path'           => $this->getPath(),
            'formatted_size' => $this->getFormattedSize(),
            'dimensions'     => $this->getDimensions(),
        ];
    }
}
