<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_credit_notes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $t->foreignId('customer_id')->constrained('billing_customers')->restrictOnDelete();
            $t->string('currency', 3);
            $t->unsignedTinyInteger('currency_precision');
            $t->string('status')->default('draft');
            $t->string('formatted_number')->nullable()->unique();
            $t->unsignedBigInteger('sequence_number')->nullable()->unique();
            $t->unsignedBigInteger('total_minor');
            $t->unsignedBigInteger('subtotal_minor')->default(0);
            $t->json('taxes');
            $t->json('seller_snapshot');
            $t->json('customer_snapshot');
            $t->date('credit_date');
            $t->text('reason');
            $t->unsignedInteger('version')->default(1);
            $t->uuid('request_key')->unique();
            $t->string('request_hash', 64);
            $t->timestamp('issued_at')->nullable();
            $t->timestamp('cancelled_at')->nullable();
            $t->text('cancellation_reason')->nullable();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });
        Schema::create('billing_credit_allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('credit_note_id')->constrained('billing_credit_notes')->restrictOnDelete();
            $t->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $t->unsignedBigInteger('amount_minor');
            $t->uuid('request_key')->unique();
            $t->timestamp('reversed_at')->nullable();
            $t->text('reversal_reason')->nullable();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('actor_name');
            $t->timestamps();
        });
        Schema::create('billing_credit_refunds', function (Blueprint $t) {
            $t->id();
            $t->foreignId('credit_note_id')->constrained('billing_credit_notes')->restrictOnDelete();
            $t->unsignedBigInteger('amount_minor');
            $t->string('currency', 3);
            $t->date('refund_date');
            $t->string('method_label');
            $t->string('reference')->nullable();
            $t->text('reason');
            $t->uuid('request_key')->unique();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('actor_name');
            $t->timestamp('reversed_at')->nullable();
            $t->date('reversal_date')->nullable();
            $t->text('reversal_reason')->nullable();
            $t->timestamps();
        });
        Schema::table('billing_payments', fn (Blueprint $t) =>$t->date('reversal_date')->nullable());
        DB::table('billing_invoice_sequences')->insert(['scope'=>'credits', 'next_number'=>1]);
        foreach (['view any credit note', 'view credit note', 'create credit note', 'update credit note', 'issue credit note', 'allocate credit note', 'reverse allocation credit note', 'refund credit note', 'cancel credit note', 'view statement', 'import billing data'] as $p) {
            Permission::findOrCreate($p, 'web');
            Role::findOrCreate('admin', 'web')->givePermissionTo($p);
        }
    }

    public function down(): void
    {
        Schema::table('billing_payments', fn (Blueprint $t) =>$t->dropColumn('reversal_date'));
        Schema::dropIfExists('billing_credit_refunds');
        Schema::dropIfExists('billing_credit_allocations');
        Schema::dropIfExists('billing_credit_notes');
        DB::table('billing_invoice_sequences')->where('scope', 'credits')->delete();
        Permission::whereIn('name', ['view any credit note', 'view credit note', 'create credit note', 'update credit note', 'issue credit note', 'allocate credit note', 'reverse allocation credit note', 'refund credit note', 'cancel credit note', 'view statement', 'import billing data'])->delete();
    }
};
