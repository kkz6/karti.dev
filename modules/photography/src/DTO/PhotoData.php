<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Spatie\LaravelData\Data;

class PhotoData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public ?string $description,
        public array $image_ids,
        public ?string $cover_image,
        public string $status,
        public bool $featured,
        public int $sort_order,
        public ?string $published_at,
        public ?array $categories,
        public ?int $photo_id = null, // For update operations
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'description' => ['nullable', 'string'],
            'image_ids' => ['required', 'array'],
            'image_ids.*' => ['integer'],
            'cover_image' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published,archived'],
            'featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
        ];
    }

    public function validationMessages(): array
    {
        return [
            'title.required' => 'The title field is required.',
            'title.max' => 'The title must not exceed 255 characters.',
            'slug.required' => 'The slug field is required.',
            'slug.regex' => 'The slug must be lowercase and contain only letters, numbers, and hyphens.',
            'image_ids.required' => 'Please select at least one image.',
            'image_ids.array' => 'Invalid image data format.',
            'status.in' => 'The selected status is invalid.',
            'categories.*.exists' => 'One or more selected categories do not exist.',
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