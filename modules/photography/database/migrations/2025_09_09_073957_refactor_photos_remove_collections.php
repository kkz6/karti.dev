<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // First, drop the index and foreign key constraint, then remove the old columns
        Schema::table('photos', function (Blueprint $table) {
            $table->dropIndex(['photo_collection_id', 'sort_order']);
            $table->dropForeign(['photo_collection_id']);
            $table->dropColumn([
                'photo_collection_id',
                'image_path',
                'alt_text',
                'width',
                'height',
                'file_size',
                'exif_data'
            ]);
        });

        // Add new columns to photos table
        Schema::table('photos', function (Blueprint $table) {
            $table->string('slug')->unique()->after('title');
            $table->json('image_ids')->default('[]')->after('description');
            $table->string('cover_image')->nullable()->after('image_ids');
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->after('cover_image');
            $table->boolean('featured')->default(false)->after('status');
            $table->timestamp('published_at')->nullable()->after('sort_order');
            
            $table->index('slug');
            $table->index('status');
            $table->index('featured');
            $table->index(['status', 'published_at']);
        });

        // Create photo_categories pivot table
        Schema::create('photo_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['photo_id', 'category_id']);
        });

        // Drop photo_collection related tables
        Schema::dropIfExists('photo_collection_categories');
        Schema::dropIfExists('photo_collections');
    }

    public function down(): void
    {
        // Recreate photo_collections table
        Schema::create('photo_collections', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('slug');
            $table->index('status');
            $table->index('featured');
            $table->index(['status', 'published_at']);
        });

        // Recreate photo_collection_categories table
        Schema::create('photo_collection_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_collection_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['photo_collection_id', 'category_id']);
        });

        // Drop photo_categories table
        Schema::dropIfExists('photo_categories');

        // Remove new columns from photos table
        Schema::table('photos', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'image_ids',
                'cover_image',
                'status',
                'featured',
                'published_at'
            ]);
        });

        // Restore old columns to photos table
        Schema::table('photos', function (Blueprint $table) {
            $table->foreignId('photo_collection_id')->after('id')->constrained()->onDelete('cascade');
            $table->string('image_path')->after('description');
            $table->string('alt_text')->nullable()->after('image_path');
            $table->integer('width')->nullable()->after('sort_order');
            $table->integer('height')->nullable()->after('width');
            $table->bigInteger('file_size')->nullable()->after('height');
            $table->json('exif_data')->nullable()->after('file_size');
            
            $table->index(['photo_collection_id', 'sort_order']);
        });
    }
};