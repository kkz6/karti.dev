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
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk', 32);
            $table->string('directory');
            $table->string('filename');
            $table->text('alt');
            $table->string('extension', 32);
            $table->string('mime_type', 128);
            $table->string('aggregate_type', 32)->index();
            $table->unsignedInteger('size');
            $table->string('variant_name', 255)->nullable();
            $table->foreignIdFor(Media::class, 'original_media_id')
                ->nullable()
                ->constrained('media')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['disk', 'directory', 'filename', 'extension']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
