<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('billing_recurring_invoices')) {
            Schema::create('billing_recurring_invoices', function (Blueprint $t) {
                $t->id();
                $t->foreignId('source_invoice_id')->constrained('billing_invoices')->restrictOnDelete();
                $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $t->string('name');
                $t->json('template');
                $t->string('interval');
                $t->unsignedInteger('every')->default(1);
                $t->string('timezone');
                $t->date('anchor_date');
                $t->date('next_date')->index();
                $t->unsignedInteger('due_days');
                $t->unsignedInteger('cycle_limit')->nullable();
                $t->unsignedInteger('cycles_done')->default(0);
                $t->string('policy')->default('draft');
                $t->boolean('active')->default(false);
                $t->unsignedInteger('version')->default(1);
                $t->text('last_error')->nullable();
                $t->timestamps();
            });
        }
        if (! Schema::hasTable('billing_recurrence_occurrences')) {
            Schema::create('billing_recurrence_occurrences', function (Blueprint $t) {
                $t->id();
                $t->foreignId('recurring_invoice_id')->constrained('billing_recurring_invoices')->restrictOnDelete();
                $t->date('scheduled_date');
                $t->foreignId('invoice_id')->nullable()->constrained('billing_invoices')->restrictOnDelete();
                $t->string('state')->default('created');
                $t->text('error')->nullable();
                $t->timestamps();
            });
        }
        // MySQL commits table creation before adding indexes. Repair the missing
        // constraint when retrying a migration interrupted by its old long name.
        if (! Schema::hasIndex('billing_recurrence_occurrences', ['recurring_invoice_id', 'scheduled_date'], 'unique')) {
            Schema::table('billing_recurrence_occurrences', function (Blueprint $t) {
                $t->unique(['recurring_invoice_id', 'scheduled_date'], 'billing_recurrence_schedule_unique');
            });
        }

        foreach (['view any recurring invoice', 'view recurring invoice', 'create recurring invoice', 'update recurring invoice'] as $p) {
            Permission::findOrCreate($p, 'web');
            Role::findOrCreate('admin', 'web')->givePermissionTo($p);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_recurrence_occurrences');
        Schema::dropIfExists('billing_recurring_invoices');
        Permission::whereIn('name', ['view any recurring invoice', 'view recurring invoice', 'create recurring invoice', 'update recurring invoice'])->delete();
    }
};
