<?php

declare(strict_types=1);

namespace Modules\Blog\DTO;

use Illuminate\Validation\Rule;
use Modules\Blog\Models\Article;
use Spatie\LaravelData\Data;

class ArticleData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public string $content,
        public ?string $excerpt,
        public int $category_id,
        public array $tags,
        public string $status,
        public ?array $featured_image,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?string $published_at,
        public ?int $article_id = null, // For update operations
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => ['required', 'exists:categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
            'status' => ['required', 'in:draft,published,archived'],
            'featured_image' => ['nullable', 'array'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    public function validationMessages(): array
    {
        return [
            'title.required' => 'The article title is required.',
            'title.max' => 'The title must not exceed 255 characters.',
            'slug.required' => 'The article slug is required.',
            'slug.max' => 'The slug must not exceed 255 characters.',
            'content.required' => 'The article content is required.',
            'category_id.required' => 'Please select a category.',
            'category_id.exists' => 'The selected category is invalid.',
            'status.required' => 'Please select an article status.',
            'status.in' => 'The status must be draft, published, or archived.',
        ];
    }

    public static function from(mixed ...$payloads): static
    {
        $instance = parent::from(...$payloads);
        
        // Add unique slug validation rule based on whether this is create or update
        if ($instance->article_id) {
            // Update operation - exclude current article from unique check
            $instance->additional['rules']['slug'][] = Rule::unique('articles', 'slug')->ignore($instance->article_id);
        } else {
            // Create operation - slug must be unique
            $instance->additional['rules']['slug'][] = 'unique:articles,slug';
        }
        
        return $instance;
    }

    /**
     * Create instance for update operation
     */
    public static function forUpdate(array $data, int $articleId): static
    {
        $data['article_id'] = $articleId;
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
