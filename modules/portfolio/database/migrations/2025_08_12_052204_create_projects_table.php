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
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->longText('long_description')->nullable();
            $table->string('logo')->nullable();
            $table->string('featured_image')->nullable();
            $table->string('link_url')->nullable();
            $table->string('link_label')->nullable();
            $table->string('github_url')->nullable();
            $table->string('demo_url')->nullable();
            $table->enum('status', ['active', 'archived', 'on_hold'])->default('active');
            $table->integer('sort_order')->default(0);
            $table->boolean('featured')->default(false);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'featured', 'sort_order']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
