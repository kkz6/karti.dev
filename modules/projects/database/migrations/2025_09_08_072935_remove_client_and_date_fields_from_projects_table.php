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
            // Remove client and date fields since these are personal projects
            if (Schema::hasColumn('projects', 'client')) {
                $table->dropColumn('client');
            }
            if (Schema::hasColumn('projects', 'start_date')) {
                $table->dropColumn('start_date');
            }
            if (Schema::hasColumn('projects', 'end_date')) {
                $table->dropColumn('end_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            // Add back the removed fields
            $table->string('client')->nullable()->after('short_description');
            $table->date('start_date')->nullable()->after('technologies');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }
};
