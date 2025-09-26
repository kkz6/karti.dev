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
        public ?array $seo,
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
            'seo' => ['nullable', 'array'],
            'seo.title' => ['nullable', 'string', 'max:60'],
            'seo.description' => ['nullable', 'string', 'max:160'],
            'seo.author' => ['nullable', 'string', 'max:255'],
            'seo.image' => ['nullable', 'string', 'max:500'],
            'seo.canonical_url' => ['nullable', 'url', 'max:500'],
            'seo.robots' => ['nullable', 'string', 'max:255'],
            'seo.type' => ['nullable', 'string', 'max:50'],
            'seo.locale' => ['nullable', 'string', 'max:10'],
            'seo.site_name' => ['nullable', 'string', 'max:255'],
            'seo.twitter_card' => ['nullable', 'string', 'max:50'],
            'seo.twitter_site' => ['nullable', 'string', 'max:255'],
            'seo.twitter_creator' => ['nullable', 'string', 'max:255'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Get validation rules for create operation
     */
    public static function createRules(): array
    {
        $rules = static::rules();
        $rules['slug'][] = 'unique:articles,slug';
        return $rules;
    }

    /**
     * Get validation rules for update operation
     */
    public static function updateRules(int $articleId): array
    {
        $rules = static::rules();
        $rules['slug'][] = Rule::unique('articles', 'slug')->ignore($articleId);
        return $rules;
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
