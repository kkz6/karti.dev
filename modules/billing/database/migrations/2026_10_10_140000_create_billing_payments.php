<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $table->uuid('request_key')->unique();
            $table->string('request_hash', 64);
            $table->unsignedBigInteger('amount_minor');
            $table->string('currency', 3);
            $table->unsignedTinyInteger('currency_precision');
            $table->date('payment_date');
            $table->string('method', 40);
            $table->string('method_label');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->timestamp('created_at');
            $table->timestamp('reversed_at')->nullable();
            $table->foreignId('reversed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reversed_by_name')->nullable();
            $table->text('reversal_reason')->nullable();
            $table->index(['invoice_id', 'reversed_at']);
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_payments');
    }
};
