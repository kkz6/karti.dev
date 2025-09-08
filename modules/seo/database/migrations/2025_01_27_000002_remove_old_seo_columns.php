<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove meta columns from articles table
        if (Schema::hasColumn('articles', 'meta_title')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }

        // Remove meta columns from categories table
        if (Schema::hasColumn('categories', 'meta_title')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }

        // Remove meta columns from tags table
        if (Schema::hasColumn('tags', 'meta_title')) {
            Schema::table('tags', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }

        // Remove meta columns from speaking_events table
        if (Schema::hasColumn('speaking_events', 'meta_title')) {
            Schema::table('speaking_events', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }

        // Remove meta columns from photo_collections table
        if (Schema::hasColumn('photo_collections', 'meta_title')) {
            Schema::table('photo_collections', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }

        // Remove meta columns from projects table
        if (Schema::hasColumn('projects', 'meta_title')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description']);
            });
        }
    }

    public function down(): void
    {
        // Add back meta columns to articles table
        Schema::table('articles', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });

        // Add back meta columns to categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });

        // Add back meta columns to tags table
        Schema::table('tags', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });

        // Add back meta columns to speaking_events table
        Schema::table('speaking_events', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });

        // Add back meta columns to photo_collections table
        Schema::table('photo_collections', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });

        // Add back meta columns to projects table
        Schema::table('projects', function (Blueprint $table) {
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
        });
    }
};
