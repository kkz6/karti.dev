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
        Schema::table('projects', function (Blueprint $table) {
            // Add missing fields that are needed but keep existing structure
            if (!Schema::hasColumn('projects', 'title')) {
                $table->string('title')->nullable()->after('name');
            }
            
            if (!Schema::hasColumn('projects', 'short_description')) {
                $table->string('short_description', 500)->nullable()->after('description');
            }
            
            if (!Schema::hasColumn('projects', 'client')) {
                $table->string('client')->nullable()->after('short_description');
            }
            
            if (!Schema::hasColumn('projects', 'project_url')) {
                $table->string('project_url')->nullable()->after('client');
            }
            
            if (!Schema::hasColumn('projects', 'technologies')) {
                $table->json('technologies')->nullable()->after('project_url');
            }
            
            if (!Schema::hasColumn('projects', 'images')) {
                $table->json('images')->nullable()->after('technologies');
            }
            
            // The content and is_internal fields are already added based on the schema
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Remove new fields
            $table->dropColumn(['content', 'is_internal']);
            
            // Add back SEO fields
            $table->string('slug')->unique()->after('title');
            $table->string('meta_title', 60)->nullable()->after('sort_order');
            $table->string('meta_description', 160)->nullable()->after('meta_title');
        });
    }
};
