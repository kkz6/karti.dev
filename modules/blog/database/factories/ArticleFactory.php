<?php

namespace Modules\Blog\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;

class ArticleFactory extends Factory
{
    protected $model = Article::class;

    public function definition(): array
    {
        $title = fake()->sentence(rand(3, 8));

        return [
            'title'                => $title,
            'slug'                 => Str::slug($title),
            'content'              => '<p>' . implode('</p><p>', fake()->paragraphs(5)) . '</p>',
            'excerpt'              => fake()->paragraph(),
            'featured_image'       => null,
            'author_name'          => fake()->name(),
            'author_email'         => fake()->email(),
            'status'               => 'draft',
            'published_at'         => null,
            'reading_time_minutes' => fake()->numberBetween(2, 15),
            'category_id'          => Category::factory(),
            'user_id'              => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'       => 'published',
            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status'       => 'draft',
            'published_at' => null,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'archived',
        ]);
    }

    public function withCategory(Category $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }
}
