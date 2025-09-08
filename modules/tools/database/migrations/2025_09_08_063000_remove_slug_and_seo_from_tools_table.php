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
        Schema::table('tools', function (Blueprint $table) {
            if (Schema::hasColumn('tools', 'slug')) {
                $table->dropUnique('tools_slug_unique');
                $table->dropColumn('slug');
            }
            if (Schema::hasColumn('tools', 'meta_title')) {
                $table->dropColumn('meta_title');
            }
            if (Schema::hasColumn('tools', 'meta_description')) {
                $table->dropColumn('meta_description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tools', function (Blueprint $table) {
            $table->string('slug')->unique()->after('title');
            $table->string('meta_title', 60)->nullable()->after('status');
            $table->string('meta_description', 160)->nullable()->after('meta_title');
            $table->index('slug');
        });
    }
};
