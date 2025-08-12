<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technologies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('color', 7)->nullable(); // hex color
            $table->string('website_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['sort_order', 'name']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technologies');
    }
};
