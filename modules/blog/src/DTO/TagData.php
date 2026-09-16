<?php

declare(strict_types=1);

namespace Modules\Blog\DTO;

use Illuminate\Validation\Rule;
use Spatie\LaravelData\Data;

class TagData extends Data
{
    public function __construct(
        public string $name,
        public string $slug,
        public ?string $description,
        public ?string $meta_title,
        public ?string $meta_description,
        public ?int $tag_id = null,
        public ?array $seo = null,
    ) {}

    public static function rules(): array
    {
        $tag = request()->route('tag');

        return [
            'name'             => ['required', 'string', 'max:255'],
            'slug'             => ['required', 'string', Rule::unique('tags', 'slug')->ignore($tag), 'max:255'],
            'description'      => ['nullable', 'string'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'seo'              => ['nullable', 'array'],
            'seo.*'            => ['nullable', 'string'],
        ];
    }
}
