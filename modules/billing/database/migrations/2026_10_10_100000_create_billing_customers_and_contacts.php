<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_customers', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('display_name');
            $table->string('legal_name')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('website', 500)->nullable();
            $table->string('tax_identifier', 100)->nullable();
            $table->string('billing_address')->nullable();
            $table->string('billing_address_line_2')->nullable();
            $table->string('billing_city', 100)->nullable();
            $table->string('billing_state', 100)->nullable();
            $table->string('billing_postal_code', 30)->nullable();
            $table->string('billing_country', 2)->nullable();
            $table->string('default_currency', 3)->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
            $table->index('display_name');
            $table->index('type');
        });

        Schema::create('billing_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('billing_customers')->restrictOnDelete();
            $table->string('name');
            $table->string('email', 254);
            $table->string('phone', 50)->nullable();
            $table->string('title', 100)->nullable();
            // Only the primary contact occupies slot 1; other contacts use NULL.
            $table->unsignedTinyInteger('primary_slot')->nullable();
            $table->boolean('invoice_emails')->default(true);
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['customer_id', 'primary_slot']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_contacts');
        Schema::dropIfExists('billing_customers');
    }
};
