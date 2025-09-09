<?php

declare(strict_types=1);

namespace Modules\Blog\DTO;

use Illuminate\Validation\Rule;
use Modules\Blog\Models\Category;
use Spatie\LaravelData\Data;

class CategoryData extends Data
{
    public function __construct(
        public string $name,
        public string $slug,
        public ?string $description,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?int $category_id = null, // For update operations
    ) {}

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];

        // Add unique slug validation rule based on whether this is create or update
        if ($this->category_id) {
            // Update operation - exclude current category from unique check
            $rules['slug'][] = Rule::unique('categories', 'slug')->ignore($this->category_id);
        } else {
            // Create operation - slug must be unique
            $rules['slug'][] = 'unique:categories,slug';
        }

        return $rules;
    }

    public function validationMessages(): array
    {
        return [
            'name.required' => 'The category name is required.',
            'name.max' => 'The name must not exceed 255 characters.',
            'slug.required' => 'The category slug is required.',
            'slug.max' => 'The slug must not exceed 255 characters.',
        ];
    }

    /**
     * Create instance for update operation
     */
    public static function forUpdate(array $data, int $categoryId): static
    {
        $data['category_id'] = $categoryId;
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
