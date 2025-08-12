<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photo_collection_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_collection_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['photo_collection_id', 'category_id']);
            $table->index('photo_collection_id');
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photo_collection_categories');
    }
};
