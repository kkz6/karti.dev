<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\PaymentMethods;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_payment_methods', function (Blueprint $t) {
            $t->id();
            $t->string('code', 100)->unique();
            $t->string('name');
            $t->boolean('enabled')->default(true);
            $t->boolean('manual')->default(true);
            $t->timestamps();
        });
        foreach (PaymentMethods::LABELS as $code => $name) {
            DB::table('billing_payment_methods')->insert(['code' => $code, 'name' => $name, 'enabled' => in_array($code, app(BillingSettings::class)->payment_methods, true), 'manual' => true, 'created_at' => now(), 'updated_at' => now()]);
        }
        Schema::table('billing_payments', fn (Blueprint $t) => $t->unsignedBigInteger('payment_method_id')->nullable());
        DB::table('billing_payments')->orderBy('id')->chunkById(100, function ($payments) {
            foreach ($payments as $payment) {
                $method = PaymentMethods::resolve($payment->method, $payment->method_label, $payment->provider !== null || $payment->method === 'imported');
                DB::table('billing_payments')->where('id', $payment->id)->update(['payment_method_id' => $method->id]);
            }
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->unsignedBigInteger('payment_method_id')->nullable(false)->change();
            $t->foreign('payment_method_id', 'billing_payments_method_fk')->references('id')->on('billing_payment_methods')->restrictOnDelete();
        });
        Schema::table('billing_credit_refunds', fn (Blueprint $t) => $t->unsignedBigInteger('payment_method_id')->nullable());
        DB::table('billing_credit_refunds')->orderBy('id')->chunkById(100, function ($refunds) {
            foreach ($refunds as $refund) {
                $method = \Modules\Billing\Models\PaymentMethod::where('name', $refund->method_label)->first()
                    ?? PaymentMethods::resolve('imported', $refund->method_label, true);
                DB::table('billing_credit_refunds')->where('id', $refund->id)->update(['payment_method_id' => $method->id]);
            }
        });
        Schema::table('billing_credit_refunds', function (Blueprint $t) {
            $t->unsignedBigInteger('payment_method_id')->nullable(false)->change();
            $t->foreign('payment_method_id', 'billing_refunds_method_fk')->references('id')->on('billing_payment_methods')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('billing_credit_refunds', function (Blueprint $t) {
            $t->dropForeign('billing_refunds_method_fk');
            $t->dropColumn('payment_method_id');
        });
        Schema::table('billing_payments', function (Blueprint $t) {
            $t->dropForeign('billing_payments_method_fk');
            $t->dropColumn('payment_method_id');
        });
        Schema::dropIfExists('billing_payment_methods');
    }
};
