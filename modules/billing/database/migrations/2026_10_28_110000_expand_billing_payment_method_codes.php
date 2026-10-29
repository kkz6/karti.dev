<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_payments', function (Blueprint $table) {
            $table->string('method', 100)->change();
        });
    }

    public function down(): void
    {
        // Retain the wider column so rollback cannot truncate recorded method codes.
    }
};
