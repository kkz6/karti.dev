<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Illuminate\Validation\Rule;
use Modules\Photography\Models\PhotoCollection;
use Spatie\LaravelData\Data;

class PhotoCollectionData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public ?string $description,
        public ?array $cover_image,
        public array $categories,
        public string $status,
        public bool $featured,
        public int $sort_order,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?string $published_at,
        public ?int $collection_id = null, // For update operations
    ) {}

    public function rules(): array
    {
        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'array'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
            'status' => ['required', 'in:draft,published,archived'],
            'featured' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
        ];

        // Add unique slug validation rule based on whether this is create or update
        if ($this->collection_id) {
            // Update operation - exclude current collection from unique check
            $rules['slug'][] = Rule::unique('photo_collections', 'slug')->ignore($this->collection_id);
        } else {
            // Create operation - slug must be unique
            $rules['slug'][] = 'unique:photo_collections,slug';
        }

        return $rules;
    }

    public function validationMessages(): array
    {
        return [
            'title.required' => 'The collection title is required.',
            'title.max' => 'The title must not exceed 255 characters.',
            'slug.required' => 'The collection slug is required.',
            'slug.max' => 'The slug must not exceed 255 characters.',
            'status.required' => 'Please select a status.',
            'status.in' => 'The status must be draft, published, or archived.',
        ];
    }

    /**
     * Create instance for update operation
     */
    public static function forUpdate(array $data, int $collectionId): static
    {
        $data['collection_id'] = $collectionId;
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
