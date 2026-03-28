<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('client')->nullable()->after('short_description');
            $table->date('start_date')->nullable()->after('github_url');
            $table->date('end_date')->nullable()->after('start_date');
            $table->string('meta_title', 60)->nullable()->after('sort_order');
            $table->string('meta_description', 160)->nullable()->after('meta_title');
        });
    }
};
