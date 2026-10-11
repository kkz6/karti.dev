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
            $table->string('customer_name')->nullable()->index();
            $table->unsignedBigInteger('sequence_number')->nullable()->unique();
            $table->string('number_prefix', 20)->nullable();
            $table->unsignedTinyInteger('number_padding')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
        });
        DB::table('billing_invoices')->orderBy('id')->each(function ($invoice) {
            $snapshot = json_decode($invoice->customer_snapshot, true);
            DB::table('billing_invoices')->where('id', $invoice->id)->update(['customer_name' => $snapshot['display_name'] ?? '']);
        });
        Schema::create('billing_invoice_sequences', function (Blueprint $table) {
            $table->string('scope')->primary();
            $table->unsignedBigInteger('next_number');
        });
        DB::table('billing_invoice_sequences')->insert(['scope' => 'invoices', 'next_number' => 1]);
        Schema::create('billing_invoice_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->string('event', 40);
            $table->text('description');
            $table->timestamp('created_at');
            $table->index(['invoice_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_invoice_activities');
        Schema::dropIfExists('billing_invoice_sequences');
        Schema::table('billing_invoices', function (Blueprint $table) {
            $table->dropUnique(['sequence_number']);
            $table->dropIndex(['customer_name']);
            $table->dropColumn(['customer_name', 'sequence_number', 'number_prefix', 'number_padding', 'issued_at', 'cancelled_at', 'cancellation_reason']);
        });
    }
};
