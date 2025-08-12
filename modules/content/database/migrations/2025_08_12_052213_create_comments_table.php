<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->string('author_name');
            $table->string('author_email');
            $table->string('author_website')->nullable();
            $table->text('content');
            $table->enum('status', ['pending', 'approved', 'spam', 'rejected'])->default('pending');
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['article_id', 'status']);
            $table->index('author_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
