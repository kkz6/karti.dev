<?php

declare(strict_types=1);

namespace Modules\Media\DTO;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Data;

class ImageEditorSaveData extends Data
{
    public function __construct(
        public string $data,
        public ?string $path,
        public string $name,
        #[MapName('mime_type')]
        public string $mimeType,
        public bool $overwrite = false,
        #[MapName('asset_id')]
        public ?int $assetId = null,
    ) {}

    public static function rules(): array
    {
        return [
            'data' => ['required', 'string'],
            'path' => ['nullable', 'string'],
            'name' => ['required', 'string'],
            'mime_type' => ['required', 'string'],
            'overwrite' => ['boolean'],
            'asset_id' => ['nullable', 'integer'],
        ];
    }
}
