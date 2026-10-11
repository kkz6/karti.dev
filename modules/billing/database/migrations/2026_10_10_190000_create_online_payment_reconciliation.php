<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\LaravelSettings\Migrations\SettingsMigration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('billing_provider.invoice_checkout_enabled', false);
        $this->migrator->add('billing_provider.invoice_product_id', '');
        $this->migrator->add('billing_provider.document_policy_confirmed', false);
        Schema::create('billing_online_checkouts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('invoice_id')->constrained('billing_invoices')->restrictOnDelete();
            $t->uuid('public_id')->unique();
            $t->uuid('request_key')->unique();
            $t->unsignedBigInteger('expected_minor');
            $t->string('currency', 3);
            $t->string('state')->default('creating');
            $t->string('session_id')->nullable()->unique();
            $t->text('checkout_url')->nullable();
            $t->text('invoice_url');
            $t->string('payment_id')->nullable()->unique();
            $t->text('error')->nullable();
            $t->timestamps();
        });
        Schema::create('billing_provider_events', function (Blueprint $t) {
            $t->id();
            $t->string('event_id')->unique();
            $t->string('event_type');
            $t->text('payload');
            $t->string('state')->default('pending');
            $t->text('error')->nullable();
            $t->timestamp('processed_at')->nullable();
            $t->timestamps();
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->string('provider')->nullable();
            $t->string('provider_payment_id')->nullable()->unique();
        });
        Schema::table('consultation_bookings', function (Blueprint $t) {
            $t->unsignedBigInteger('expected_amount_minor')->nullable();
            $t->string('expected_currency', 3)->nullable();
            $t->string('return_token_hash', 64)->nullable();
            $t->string('fulfillment_state')->default('unverified');
            $t->foreignId('billing_customer_id')->nullable()->constrained('billing_customers')->restrictOnDelete();
        });
        foreach (['checkout invoice', 'view payment reconciliation', 'link consultation customer'] as $name) {
            Permission::findOrCreate($name, 'web');
            Role::findOrCreate('admin', 'web')->givePermissionTo($name);
        }
    }

    public function down(): void
    {
        Schema::table('consultation_bookings', function (Blueprint $t) {
            $t->dropConstrainedForeignId('billing_customer_id');
            $t->dropColumn(['expected_amount_minor', 'expected_currency', 'return_token_hash', 'fulfillment_state']);
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->dropUnique(['provider_payment_id']);
            $t->dropColumn(['provider', 'provider_payment_id']);
        });
        Schema::dropIfExists('billing_provider_events');
        Schema::dropIfExists('billing_online_checkouts');
        foreach (['invoice_checkout_enabled', 'invoice_product_id', 'document_policy_confirmed'] as $p) {
            $this->migrator->delete('billing_provider.'.$p);
        }
        Permission::whereIn('name', ['checkout invoice', 'view payment reconciliation', 'link consultation customer'])->delete();
    }
};
