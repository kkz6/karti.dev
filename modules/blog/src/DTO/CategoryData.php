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

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get validation rules for create operation
     */
    public static function createRules(): array
    {
        $rules = static::rules();
        $rules['slug'][] = 'unique:categories,slug';
        return $rules;
    }

    /**
     * Get validation rules for update operation
     */
    public static function updateRules(int $categoryId): array
    {
        $rules = static::rules();
        $rules['slug'][] = Rule::unique('categories', 'slug')->ignore($categoryId);
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
