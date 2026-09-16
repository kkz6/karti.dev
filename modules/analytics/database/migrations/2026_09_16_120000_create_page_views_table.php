<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->char('event_key', 64)->unique();
            $table->char('visitor_hash', 64);
            $table->date('viewed_on');
            $table->timestamp('viewed_at');
            $table->string('path', 512);
            $table->string('referrer_host')->nullable();
            $table->string('browser', 100);
            $table->string('platform', 100);
            $table->string('device', 50);
            $table->index(['viewed_on', 'visitor_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
