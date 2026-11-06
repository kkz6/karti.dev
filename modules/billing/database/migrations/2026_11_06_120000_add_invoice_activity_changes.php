<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_invoice_activities', fn (Blueprint $table) => $table->json('changes')->nullable());
    }

    public function down(): void
    {
        Schema::table('billing_invoice_activities', fn (Blueprint $table) => $table->dropColumn('changes'));
    }
};
