<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class PhotoData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public ?string $description,
        public array $image_ids,
        public ?int $cover_image,
        public string $status,
        public bool $featured,
        public int $sort_order,
        public ?string $published_at,
        public ?array $categories,
        public ?int $photo_id = null, // For update operations
    ) {}

    public static function rules(ValidationContext $context): array
    {
        $photoId = $context->payload['photo_id'] ?? null;

        $slugRule = ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'];

        if ($photoId) {
            $slugRule[] = 'unique:photos,slug,'.$photoId;
        } else {
            $slugRule[] = 'unique:photos,slug';
        }

        return [
            'title'        => ['required', 'string', 'max:255'],
            'slug'         => $slugRule,
            'description'  => ['nullable', 'string'],
            'image_ids'    => ['required', 'array'],
            'image_ids.*'  => ['integer', 'exists:media,id'],
            'cover_image'  => ['nullable', 'integer', 'exists:media,id'],
            'status'       => ['required', 'in:draft,published,archived'],
            'featured'     => ['boolean'],
            'sort_order'   => ['integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
            'categories'   => ['nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
            'photo_id'     => ['nullable', 'integer'],
        ];
    }

    public function validationMessages(): array
    {
        return [
            'title.required'      => 'The title field is required.',
            'title.max'           => 'The title must not exceed 255 characters.',
            'slug.required'       => 'The slug field is required.',
            'slug.regex'          => 'The slug must be lowercase and contain only letters, numbers, and hyphens.',
            'slug.unique'         => 'This slug is already taken. Please choose a different one.',
            'image_ids.required'  => 'Please select at least one image.',
            'image_ids.array'     => 'Invalid image data format.',
            'status.in'           => 'The selected status is invalid.',
            'categories.*.exists' => 'One or more selected categories do not exist.',
        ];
    }
}
