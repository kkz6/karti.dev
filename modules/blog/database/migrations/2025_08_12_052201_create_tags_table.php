<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color', 7)->nullable(); // hex color
            $table->timestamps();

            $table->index('slug');
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
