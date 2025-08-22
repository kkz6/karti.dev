<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Media\Models\Media;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mediables', function (Blueprint $table) {
            $table->foreignIdFor(Media::class)->constrained('media')->cascadeOnDelete();
            $table->morphs('mediable');
            $table->string('tag')->index();
            $table->unsignedInteger('order')->index();
            $table->primary(['media_id', 'mediable_type', 'mediable_id', 'tag']);
            $table->index(['mediable_id', 'mediable_type']);
        });
    }
};
