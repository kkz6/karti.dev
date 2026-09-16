<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_views', function (Blueprint $table): void {
            $table->string('content_type', 20)->nullable();
            $table->unsignedBigInteger('content_id')->nullable();
            $table->index(['content_type', 'content_id', 'viewed_on'], 'page_views_content_date_index');
            $table->index(['path', 'viewed_on'], 'page_views_path_date_index');
        });

        // Preserve existing local history where the current URL identifies the entry.
        foreach (['articles' => ['article', '/articles/'], 'photos' => ['gallery', '/photography/']] as $table => [$type, $prefix]) {
            DB::table($table)->select(['id', 'slug'])->orderBy('id')->chunkById(200, function ($entries) use ($type, $prefix): void {
                foreach ($entries as $entry) {
                    DB::table('page_views')->where('path', $prefix.$entry->slug)->whereNull('content_type')
                        ->update(['content_type' => $type, 'content_id' => $entry->id]);
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('page_views', function (Blueprint $table): void {
            $table->dropIndex('page_views_content_date_index');
            $table->dropIndex('page_views_path_date_index');
            $table->dropColumn(['content_type', 'content_id']);
        });
    }
};
