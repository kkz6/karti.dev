<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class IntArrayCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_map(fn ($v) => (int) $v, array_filter($value, fn ($v) => $v !== '' && $v !== null));
    }
}

class NullableIntCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): ?int
    {
        if ($value === '' || $value === null) {
            return null;
        }

        return (int) $value;
    }
}

class PhotoData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public ?string $description,
        #[WithCast(IntArrayCast::class)]
        public array $image_ids,
        #[WithCast(NullableIntCast::class)]
        public ?int $cover_image,
        public string $status,
        public bool $featured,
        public int $sort_order,
        public ?string $published_at,
        public ?array $categories,
        public ?int $photo_id = null,
        public ?string $meta_title = null,
        public ?string $meta_description = null,
        public ?array $seo = null,
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
            'title'            => ['required', 'string', 'max:255'],
            'slug'             => $slugRule,
            'description'      => ['nullable', 'string'],
            'image_ids'        => ['required', 'array', 'min:1'],
            'image_ids.*'      => ['numeric', 'exists:media,id'],
            'cover_image'      => ['nullable', 'numeric', 'exists:media,id'],
            'status'           => ['required', 'in:draft,published,archived'],
            'featured'         => ['boolean'],
            'sort_order'       => ['integer', 'min:0'],
            'published_at'     => ['nullable', 'date'],
            'categories'       => ['nullable', 'array'],
            'categories.*'     => ['exists:categories,id'],
            'photo_id'         => ['nullable', 'integer'],
            'meta_title'       => ['nullable', 'string', 'max:60'],
            'meta_description' => ['nullable', 'string', 'max:160'],
            'seo'              => ['nullable', 'array'],
            'seo.*'            => ['nullable', 'string'],
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
