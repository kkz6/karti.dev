<?php

namespace Modules\Blog\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        // Categories
        $categories = $this->createCategories();

        // Tags
        $tags = $this->createTags();

        // Articles
        $this->createArticles($categories, $tags);
    }

    private function createCategories(): array
    {
        $categoriesData = [
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'Articles about technology and software development', 'color' => '#3B82F6'],
            ['name' => 'Design', 'slug' => 'design', 'description' => 'UI/UX design and visual design articles', 'color' => '#8B5CF6'],
            ['name' => 'Business', 'slug' => 'business', 'description' => 'Entrepreneurship and business strategy', 'color' => '#10B981'],
            ['name' => 'Space', 'slug' => 'space', 'description' => 'Space exploration and aerospace technology', 'color' => '#F59E0B'],
            ['name' => 'Web Development', 'slug' => 'web-development', 'description' => 'Frontend and backend web development', 'color' => '#EF4444'],
        ];

        $categories = [];
        foreach ($categoriesData as $index => $categoryData) {
            $categoryData['sort_order'] = $index;
            $categories[]               = Category::create($categoryData);
        }

        return $categories;
    }

    private function createTags(): array
    {
        $tagsData = [
            ['name' => 'React', 'slug' => 'react', 'color' => '#61DAFB'],
            ['name' => 'JavaScript', 'slug' => 'javascript', 'color' => '#F7DF1E'],
            ['name' => 'Laravel', 'slug' => 'laravel', 'color' => '#FF2D20'],
            ['name' => 'PHP', 'slug' => 'php', 'color' => '#777BB4'],
            ['name' => 'UI/UX', 'slug' => 'ui-ux', 'color' => '#FF6B6B'],
            ['name' => 'Startup', 'slug' => 'startup', 'color' => '#4ECDC4'],
            ['name' => 'Leadership', 'slug' => 'leadership', 'color' => '#45B7D1'],
        ];

        $tags = [];
        foreach ($tagsData as $tagData) {
            $tags[] = Tag::create($tagData);
        }

        return $tags;
    }

    private function createArticles(array $categories, array $tags): void
    {
        $articlesData = [
            [
                'title'                => 'Crafting a design system for a multiplanetary future',
                'slug'                 => 'crafting-a-design-system-for-a-multiplanetary-future',
                'content'              => '<p>Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>',
                'excerpt'              => 'Most companies try to stay ahead of the curve when it comes to visual design, but for Planetaria we needed to create a brand that would still inspire us 100 years from now when humanity has spread across our entire solar system.',
                'status'               => 'published',
                'published_at'         => now()->subDays(5),
                'author_name'          => 'Spencer Sharp',
                'reading_time_minutes' => 8,
            ],
            [
                'title'                => 'Introducing Animaginary: High performance web animations',
                'slug'                 => 'introducing-animaginary',
                'content'              => '<p>When you\'re building a website for a company as ambitious as Planetaria, you need to make an impression. I wanted people to visit our website and see animations that looked more realistic than reality itself.</p>',
                'excerpt'              => 'When you\'re building a website for a company as ambitious as Planetaria, you need to make an impression.',
                'status'               => 'published',
                'published_at'         => now()->subDays(8),
                'author_name'          => 'Spencer Sharp',
                'reading_time_minutes' => 12,
            ],
            [
                'title'                => 'Rewriting the cosmOS kernel in Rust',
                'slug'                 => 'rewriting-the-cosmos-kernel-in-rust',
                'content'              => '<p>When we released the first version of cosmOS last year, it was written in Go. Go is a wonderful programming language, but it\'s been a while since I\'ve seen an article on the front page of Hacker News about rewriting some important tool in Go and I see articles on there about rewriting things in Rust every single week.</p>',
                'excerpt'              => 'When we released the first version of cosmOS last year, it was written in Go.',
                'status'               => 'published',
                'published_at'         => now()->subDays(15),
                'author_name'          => 'Spencer Sharp',
                'reading_time_minutes' => 15,
            ],
        ];

        foreach ($articlesData as $articleData) {
            $article = Article::create($articleData);

            // Attach random categories and tags
            $article->categories()->attach($categories[array_rand($categories)]->id);
            $article->tags()->attach($tags[array_rand($tags)]->id);
            $article->tags()->attach($tags[array_rand($tags)]->id);
        }
    }
}
