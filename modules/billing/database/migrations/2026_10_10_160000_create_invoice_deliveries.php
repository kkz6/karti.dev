<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_invoice_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $table->uuid('request_key')->unique();
            $table->string('request_hash', 64);
            $table->json('recipients');
            $table->string('subject');
            $table->text('message')->nullable();
            $table->string('pdf_path');
            $table->string('pdf_hash', 64);
            $table->string('pdf_name');
            $table->string('kind')->default('invoice');
            $table->string('occurrence_key')->nullable()->unique();
            $table->string('state')->default('queued')->index();
            $table->text('error')->nullable();
            $table->text('invoice_url')->nullable();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_invoice_deliveries');
    }
};
