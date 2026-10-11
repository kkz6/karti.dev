<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_invoices', function (Blueprint $table) {
            // Newly issued invoices share one namespace. Historical imports use
            // a stable source-record namespace while displaying their original number.
            $table->string('number_scope', 80)->default('native');
            $table->unique(['number_scope', 'formatted_number'], 'billing_invoices_scoped_number_unique');
            $table->index('formatted_number', 'billing_invoices_number_index');
            $table->dropUnique('billing_invoices_formatted_number_unique');
        });
    }

    public function down(): void
    {
        if (DB::table('billing_invoices')->whereNotNull('formatted_number')->groupBy('formatted_number')->havingRaw('COUNT(*) > 1')->exists()) {
            throw new RuntimeException('Cannot restore globally unique invoice numbers while historical duplicates exist. No invoice records were modified.');
        }
        Schema::table('billing_invoices', function (Blueprint $table) {
            $table->unique('formatted_number');
            $table->dropUnique('billing_invoices_scoped_number_unique');
            $table->dropIndex('billing_invoices_number_index');
            $table->dropColumn('number_scope');
        });
    }
};
