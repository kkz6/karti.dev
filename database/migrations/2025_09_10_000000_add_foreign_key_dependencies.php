<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add foreign key relationships to articles table
        Schema::table('articles', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('reading_time_minutes')->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->after('category_id')->constrained()->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn(['category_id', 'user_id']);
        });
    }
};
