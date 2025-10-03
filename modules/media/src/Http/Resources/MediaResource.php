<?php

namespace Modules\Media\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fullFilename = $this->filename . '.' . $this->extension;
        $fullPath = $this->directory ? $this->directory . '/' . $fullFilename : $fullFilename;

        return [
            'id' => (string) $this->id,
            'disk' => $this->disk,
            'directory' => $this->directory,
            'filename' => $this->filename,
            'title' => $this->title ?? $this->filename,
            'alt' => $this->alt,
            'extension' => $this->extension,
            'mime_type' => $this->mime_type,
            'aggregate_type' => $this->aggregate_type,
            'size' => $this->size,
            'variant_name' => $this->variant_name,
            'original_media_id' => $this->original_media_id,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'credit' => $this->credit,
            'caption' => $this->caption,
            'focus' => $this->focus,
            'container_id' => $this->disk,
            'is_image' => $this->aggregate_type === 'image',
            'is_audio' => $this->aggregate_type === 'audio',
            'is_video' => $this->aggregate_type === 'video',
            'url' => Storage::disk($this->disk)->url($fullPath),
            'thumbnail_url' => $this->getThumbnailUrl(),
            'preview' => $this->aggregate_type === 'image' ? Storage::disk($this->disk)->url($fullPath) : null,
            'path' => $fullPath,
            'formatted_size' => $this->getFormattedSize(),
            'dimensions' => null,
        ];
    }

    protected function getThumbnailUrl(): ?string
    {
        if ($this->aggregate_type !== 'image') {
            return null;
        }

        $thumbVariant = $this->resource->variants->firstWhere('variant_name', 'thumb');

        if ($thumbVariant) {
            return $thumbVariant->getUrl();
        }

        $fullFilename = $this->filename . '.' . $this->extension;
        $fullPath = $this->directory ? $this->directory . '/' . $fullFilename : $fullFilename;

        return Storage::disk($this->disk)->url($fullPath);
    }

    protected function getFormattedSize(): string
    {
        $bytes = $this->size;
        if ($bytes === 0) {
            return '0 Bytes';
        }

        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));

        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }
}
