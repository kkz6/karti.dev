<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('short_description')->nullable();
            $table->string('client')->nullable();
            $table->string('project_url')->nullable();
            $table->string('github_url')->nullable();
            $table->json('technologies')->nullable();
            $table->string('featured_image')->nullable();
            $table->json('images')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'featured']);
            $table->index(['status', 'sort_order']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
