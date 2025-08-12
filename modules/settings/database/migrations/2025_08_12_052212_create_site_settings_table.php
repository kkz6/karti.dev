<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->longText('value')->nullable();
            $table->enum('type', ['string', 'text', 'boolean', 'integer', 'float', 'array', 'json'])->default('string');
            $table->string('group')->default('general'); // general, seo, social, etc.
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false); // can be exposed to frontend
            $table->timestamps();

            $table->index('key');
            $table->index(['group', 'is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
