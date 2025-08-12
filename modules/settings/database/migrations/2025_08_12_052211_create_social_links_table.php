<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_links', function (Blueprint $table) {
            $table->id();
            $table->string('platform'); // twitter, github, linkedin, etc.
            $table->string('label');
            $table->string('url');
            $table->string('icon')->nullable(); // icon class or path
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('show_in_header')->default(true);
            $table->boolean('show_in_footer')->default(true);
            $table->boolean('show_in_about')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
            $table->index('platform');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_links');
    }
};
