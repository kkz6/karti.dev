<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_import_batches', function (Blueprint $t) {
            $t->id();
            $t->string('source');
            $t->string('input_hash', 64);
            $t->text('manifest');
            $t->json('report');
            $t->string('state')->default('reviewed');
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('imported_at')->nullable();
            $t->timestamps();
            $t->unique(['source', 'input_hash']);
        });
        Schema::create('billing_import_mappings', function (Blueprint $t) {
            $t->id();
            $t->string('source');
            $t->string('kind', 30);
            $t->string('external_id', 100);
            $t->unsignedBigInteger('destination_id');
            $t->string('source_hash', 64);
            $t->timestamps();
            $t->unique(['source', 'kind', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_import_mappings');
        Schema::dropIfExists('billing_import_batches');
    }
};
