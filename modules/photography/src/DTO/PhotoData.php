<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Spatie\LaravelData\Data;

class PhotoData extends Data
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public array $image_path,
        public ?string $alt_text,
        public int $sort_order,
        public ?int $width,
        public ?int $height,
        public ?int $file_size,
        public ?array $exif_data,
        public ?int $photo_id = null, // For update operations
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_path' => ['required', 'array'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
            'file_size' => ['nullable', 'integer', 'min:0'],
            'exif_data' => ['nullable', 'array'],
        ];
    }

    public function validationMessages(): array
    {
        return [
            'image_path.required' => 'Please select an image.',
            'image_path.array' => 'Invalid image data format.',
            'alt_text.max' => 'The alt text must not exceed 255 characters.',
            'width.min' => 'Width must be at least 1 pixel.',
            'height.min' => 'Height must be at least 1 pixel.',
            'file_size.min' => 'File size cannot be negative.',
        ];
    }

    /**
     * Create instance for update operation
     */
    public static function forUpdate(array $data, int $photoId): static
    {
        $data['photo_id'] = $photoId;
        return static::from($data);
    }

    /**
     * Create instance for create operation
     */
    public static function forCreate(array $data): static
    {
        return static::from($data);
    }
}
