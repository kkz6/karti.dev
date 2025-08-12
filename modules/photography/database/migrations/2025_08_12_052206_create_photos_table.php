<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_collection_id')->constrained()->onDelete('cascade');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('image_path');
            $table->string('alt_text')->nullable();
            $table->integer('sort_order')->default(0);
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->bigInteger('file_size')->nullable(); // bytes
            $table->json('exif_data')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['photo_collection_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
