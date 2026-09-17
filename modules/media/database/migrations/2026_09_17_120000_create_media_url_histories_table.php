<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_url_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->string('path_hash', 64)->unique();
            $table->text('path');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_url_histories');
    }
};
