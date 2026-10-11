<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit', 50);
            $table->decimal('rate', 19, 4);
            $table->string('currency', 3);
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
            $table->index('name');
            $table->index(['currency', 'archived_at']);
        });
        Schema::create('billing_tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->decimal('percentage', 7, 4);
            $table->timestamp('archived_at')->nullable()->index();
            $table->timestamps();
        });
        Schema::create('billing_service_tax_rates', function (Blueprint $table) {
            $table->foreignId('service_id')->constrained('billing_services')->restrictOnDelete();
            $table->foreignId('tax_rate_id')->constrained('billing_tax_rates')->restrictOnDelete();
            $table->primary(['service_id', 'tax_rate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_service_tax_rates');
        Schema::dropIfExists('billing_tax_rates');
        Schema::dropIfExists('billing_services');
    }
};
