<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Billing\Support\DeliveryTemplates;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('billing_delivery.sms_enabled', false);
        $this->migrator->add('billing_delivery.sms_provider', 'twilio');
        $this->migrator->add('billing_delivery.twilio_account_sid', '');
        $this->migrator->addEncrypted('billing_delivery.twilio_auth_token', '');
        $this->migrator->add('billing_delivery.twilio_from', '');
        $this->migrator->addEncrypted('billing_delivery.msg91_auth_key', '');
        $this->migrator->add('billing_delivery.msg91_templates', array_fill_keys(DeliveryTemplates::EVENTS, ['id' => '', 'variables' => []]));
        $this->migrator->add('billing_delivery.templates', DeliveryTemplates::defaults());
        foreach (['reminder_email' => true, 'reminder_sms' => false, 'receipt_email' => false, 'receipt_sms' => false] as $key => $value) {
            $this->migrator->add('billing_automation.'.$key, $value);
        }
        Schema::table('billing_invoice_deliveries', function (Blueprint $table) {
            $table->string('channel')->default('email');
            $table->string('provider')->nullable();
            $table->longText('provider_payload')->nullable();
            $table->unsignedBigInteger('payment_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('billing_invoice_deliveries', fn (Blueprint $table) => $table->dropColumn(['channel', 'provider', 'provider_payload', 'payment_id']));
        foreach (['sms_enabled', 'sms_provider', 'twilio_account_sid', 'twilio_auth_token', 'twilio_from', 'msg91_auth_key', 'msg91_templates', 'templates'] as $key) {
            $this->migrator->delete('billing_delivery.'.$key);
        }
        foreach (['reminder_email', 'reminder_sms', 'receipt_email', 'receipt_sms'] as $key) {
            $this->migrator->delete('billing_automation.'.$key);
        }
    }
};
