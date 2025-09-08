<?php

declare(strict_types=1);

namespace Modules\Blog\DTO;

use Illuminate\Validation\Rule;
use Modules\Blog\Models\Tag;
use Spatie\LaravelData\Data;

class TagData extends Data
{
    public function __construct(
        public string $name,
        public string $slug,
        public ?string $description,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?int $tag_id = null, // For update operations
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

    public function validationMessages(): array
    {
        return [
            'name.required' => 'The tag name is required.',
            'name.max' => 'The name must not exceed 255 characters.',
            'slug.required' => 'The tag slug is required.',
            'slug.max' => 'The slug must not exceed 255 characters.',
        ];
    }

    public static function from(mixed ...$payloads): static
    {
        $instance = parent::from(...$payloads);
        
        // Add unique slug validation rule based on whether this is create or update
        if ($instance->tag_id) {
            // Update operation - exclude current tag from unique check
            $instance->additional['rules']['slug'][] = Rule::unique('tags', 'slug')->ignore($instance->tag_id);
        } else {
            // Create operation - slug must be unique
            $instance->additional['rules']['slug'][] = 'unique:tags,slug';
        }
        
        return $instance;
    }

    /**
     * Create instance for update operation
     */
    public static function forUpdate(array $data, int $tagId): static
    {
        $data['tag_id'] = $tagId;
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
