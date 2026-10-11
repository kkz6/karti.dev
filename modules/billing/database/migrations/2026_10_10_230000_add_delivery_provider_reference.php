<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_invoice_deliveries', fn (Blueprint $t) =>$t->string('provider_reference')->nullable());
    }

    public function down(): void
    {
        Schema::table('billing_invoice_deliveries', fn (Blueprint $t) =>$t->dropColumn('provider_reference'));
    }
};
