<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_import_batches', function (Blueprint $table) {
            $table->longText('manifest')->change();
        });
    }

    public function down(): void
    {
        // Retain capacity: shrinking this column could truncate an imported archive.
    }
};
