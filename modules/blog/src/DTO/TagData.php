<?php

declare(strict_types=1);

namespace Modules\Blog\DTO;

use Illuminate\Container\Attributes\RouteParameter;
use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class TagData extends Data
{
    public function __construct(
        public string $name,
        public string $slug,
        public ?string $description,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?int $tag_id = null,
    ) {}

    public static function rules(
        ValidationContext $context,
        #[RouteParameter('tag')] ?string $tag,
    ): array {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'slug'             => ['required', 'string', ! $tag ? 'unique:tags,slug' : Rule::unique('tags', 'slug')->ignore($tagId), 'max:255'],
            'description'      => ['nullable', 'string'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
