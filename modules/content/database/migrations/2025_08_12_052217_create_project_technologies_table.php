<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_technologies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('technology_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['project_id', 'technology_id']);
            $table->index('project_id');
            $table->index('technology_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_technologies');
    }
};
