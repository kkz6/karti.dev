<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate Articles
        $articles = DB::table('articles')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($articles as $article) {
            if ($article->meta_title || $article->meta_description) {
                DB::table('seos')->insert([
                    'title' => $article->meta_title,
                    'description' => $article->meta_description,
                    'seoable_type' => 'Modules\\Blog\\Models\\Article',
                    'seoable_id' => $article->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrate Categories
        $categories = DB::table('categories')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($categories as $category) {
            if ($category->meta_title || $category->meta_description) {
                DB::table('seos')->insert([
                    'title' => $category->meta_title,
                    'description' => $category->meta_description,
                    'seoable_type' => 'Modules\\Blog\\Models\\Category',
                    'seoable_id' => $category->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrate Tags
        $tags = DB::table('tags')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($tags as $tag) {
            if ($tag->meta_title || $tag->meta_description) {
                DB::table('seos')->insert([
                    'title' => $tag->meta_title,
                    'description' => $tag->meta_description,
                    'seoable_type' => 'Modules\\Blog\\Models\\Tag',
                    'seoable_id' => $tag->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrate Speaking Events
        $speakingEvents = DB::table('speaking_events')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($speakingEvents as $event) {
            if ($event->meta_title || $event->meta_description) {
                DB::table('seos')->insert([
                    'title' => $event->meta_title,
                    'description' => $event->meta_description,
                    'seoable_type' => 'Modules\\Speaking\\Models\\SpeakingEvent',
                    'seoable_id' => $event->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrate Photo Collections
        $photoCollections = DB::table('photo_collections')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($photoCollections as $collection) {
            if ($collection->meta_title || $collection->meta_description) {
                DB::table('seos')->insert([
                    'title' => $collection->meta_title,
                    'description' => $collection->meta_description,
                    'seoable_type' => 'Modules\\Photography\\Models\\PhotoCollection',
                    'seoable_id' => $collection->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // Migrate Projects
        $projects = DB::table('projects')
            ->whereNotNull('meta_title')
            ->orWhereNotNull('meta_description')
            ->get();

        foreach ($projects as $project) {
            if ($project->meta_title || $project->meta_description) {
                DB::table('seos')->insert([
                    'title' => $project->meta_title,
                    'description' => $project->meta_description,
                    'seoable_type' => 'Modules\\Projects\\Models\\Project',
                    'seoable_id' => $project->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Remove all migrated SEO data
        DB::table('seos')->whereIn('seoable_type', [
            'Modules\\Blog\\Models\\Article',
            'Modules\\Blog\\Models\\Category',
            'Modules\\Blog\\Models\\Tag',
            'Modules\\Speaking\\Models\\SpeakingEvent',
            'Modules\\Photography\\Models\\PhotoCollection',
            'Modules\\Projects\\Models\\Project',
        ])->delete();
    }
};
