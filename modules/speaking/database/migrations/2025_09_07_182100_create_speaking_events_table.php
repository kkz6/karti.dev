<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('speaking_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('event_name');
            $table->date('event_date')->nullable();
            $table->enum('event_type', ['conference', 'podcast', 'workshop', 'webinar'])->default('conference');
            $table->string('location')->nullable();
            $table->string('url')->nullable();
            $table->string('cta_text')->default('Watch video');
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->string('meta_title', 60)->nullable();
            $table->string('meta_description', 160)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'event_type']);
            $table->index(['status', 'featured']);
            $table->index('event_date');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('speaking_events');
    }
};
