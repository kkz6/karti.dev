<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('billing_customers')->restrictOnDelete();
            $table->string('status', 20)->default('draft');
            $table->string('formatted_number')->nullable()->unique();
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->string('currency', 3);
            $table->unsignedTinyInteger('currency_precision');
            $table->unsignedInteger('version')->default(1);
            $table->json('customer_snapshot');
            $table->json('seller_snapshot');
            $table->string('discount_mode', 20)->default('none');
            $table->decimal('discount_value', 14, 4)->default(0);
            $table->bigInteger('subtotal_minor');
            $table->bigInteger('discount_minor');
            $table->bigInteger('tax_minor');
            $table->bigInteger('total_minor');
            $table->text('customer_note')->nullable();
            $table->text('internal_note')->nullable();
            $table->text('terms')->nullable();
            $table->text('payment_instructions')->nullable();
            $table->timestamps();
            $table->index(['status', 'invoice_date']);
            $table->index('currency');
        });
        Schema::create('billing_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->cascadeOnDelete();
            $table->uuid('key');
            $table->foreignId('service_id')->nullable()->constrained('billing_services')->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('description', 1000);
            $table->text('additional_description')->nullable();
            $table->string('unit', 50);
            $table->decimal('quantity', 12, 4);
            $table->decimal('rate', 19, 4);
            $table->bigInteger('gross_minor');
            $table->bigInteger('discount_minor');
            $table->bigInteger('net_minor');
            $table->bigInteger('tax_minor');
            $table->bigInteger('total_minor');
            $table->unique(['invoice_id', 'key']);
        });
        Schema::create('billing_invoice_item_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_item_id')->constrained('billing_invoice_items')->cascadeOnDelete();
            $table->foreignId('tax_rate_id')->nullable()->constrained('billing_tax_rates')->restrictOnDelete();
            $table->string('name', 100);
            $table->decimal('percentage', 7, 4);
            $table->bigInteger('amount_minor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_invoice_item_taxes');
        Schema::dropIfExists('billing_invoice_items');
        Schema::dropIfExists('billing_invoices');
    }
};
