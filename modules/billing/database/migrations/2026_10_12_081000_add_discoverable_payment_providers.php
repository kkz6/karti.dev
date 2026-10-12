<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('billing_provider.default_provider', 'dodo');
        $this->migrator->add('billing_provider.enabled_providers', ['dodo']);
        $this->migrator->addEncrypted('billing_provider.provider_settings', []);
        Schema::table('billing_online_checkouts', function (Blueprint $t) {
            $t->string('provider', 64)->default('dodo');
            $t->dropUnique(['session_id']);
            $t->dropUnique(['payment_id']);
            $t->unique(['provider', 'session_id'], 'billing_checkout_session_unique');
            $t->unique(['provider', 'payment_id'], 'billing_checkout_payment_unique');
        });
        Schema::table('billing_provider_events', function (Blueprint $t) {
            $t->string('provider', 64)->default('dodo');
            $t->dropUnique(['event_id']);
            $t->unique(['provider', 'event_id'], 'billing_provider_event_unique');
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->dropUnique(['provider_payment_id']);
            $t->unique(['provider', 'provider_payment_id'], 'billing_provider_payment_unique');
        });
    }

    public function down(): void
    {
        foreach (['billing_online_checkouts', 'billing_provider_events', 'billing_payments'] as $table) {
            if (DB::table($table)->whereNotNull('provider')->where('provider', '!=', 'dodo')->exists()) {
                throw new RuntimeException('Cannot remove provider identities while another gateway has payment history.');
            }
        }
        Schema::table('billing_online_checkouts', function (Blueprint $t) {
            $t->dropUnique('billing_checkout_session_unique');
            $t->dropUnique('billing_checkout_payment_unique');
            $t->unique('session_id');
            $t->unique('payment_id');
            $t->dropColumn('provider');
        });
        Schema::table('billing_provider_events', function (Blueprint $t) {
            $t->dropUnique('billing_provider_event_unique');
            $t->unique('event_id');
            $t->dropColumn('provider');
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->dropUnique('billing_provider_payment_unique');
            $t->unique('provider_payment_id');
        });
        foreach (['default_provider', 'enabled_providers', 'provider_settings'] as $key) {
            $this->migrator->delete('billing_provider.'.$key);
        }
    }
};
