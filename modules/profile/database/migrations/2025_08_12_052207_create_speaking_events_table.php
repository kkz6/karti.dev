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
            $table->string('event_url')->nullable();
            $table->timestamp('event_date');
            $table->string('location')->nullable();
            $table->enum('type', ['conference', 'podcast', 'workshop', 'webinar', 'interview'])->default('conference');
            $table->string('cta_text')->default('View details');
            $table->string('cta_url')->nullable();
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->enum('status', ['upcoming', 'completed', 'cancelled'])->default('upcoming');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'event_date']);
            $table->index(['featured', 'sort_order']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('speaking_events');
    }
};
