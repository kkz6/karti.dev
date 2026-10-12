<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Billing\Models\PaymentMethod;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\PaymentMethods;
use Modules\Shared\Http\Controllers\BaseController;

class PaymentMethodsController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('view', BillingSettings::class);

        return Inertia::render('billing::payment-methods', ['methods' => PaymentMethod::where('manual', true)->withCount(['payments', 'refunds'])->orderBy('name')->get(['id', 'name', 'code', 'enabled']), 'canUpdate' => $request->user()->can('update', BillingSettings::class)]);
    }

    public function store(Request $request)
    {
        $this->authorize('update', BillingSettings::class);
        $data = $request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('billing_payment_methods', 'name')->where('manual', true)], 'enabled' => ['required', 'boolean']]);
        DB::transaction(function () use ($data) {
            PaymentMethod::create([...$data, 'code' => 'manual_'.Str::uuid(), 'manual' => true]);
            PaymentMethods::syncEnabled();
        });

        return back()->with('success', 'Payment method added.');
    }

    public function update(Request $request, PaymentMethod $paymentMethod)
    {
        $this->authorize('update', BillingSettings::class);
        abort_unless($paymentMethod->manual, 404);
        $data = $request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('billing_payment_methods', 'name')->where('manual', true)->ignore($paymentMethod)], 'enabled' => ['required', 'boolean']]);
        DB::transaction(function () use ($data, $paymentMethod) {
            $paymentMethod->update($data);
            PaymentMethods::syncEnabled();
        });

        return back()->with('success', 'Payment method updated. Existing payment history keeps its original label.');
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod)
    {
        $this->authorize('update', BillingSettings::class);
        abort_unless($paymentMethod->manual, 404);
        try {
            DB::transaction(function () use ($paymentMethod) {
                $method = PaymentMethod::whereKey($paymentMethod->id)->lockForUpdate()->firstOrFail();
                if ($method->payments()->exists() || $method->refunds()->exists()) {
                    $this->inUse();
                }
                $method->delete();
                PaymentMethods::syncEnabled();
            });
        } catch (QueryException $error) {
            if (in_array((string) ($error->errorInfo[0] ?? ''), ['23000', '23503'], true)) {
                $this->inUse();
            }
            throw $error;
        }

        return back()->with('success', 'Payment method deleted.');
    }

    private function inUse(): never
    {
        throw ValidationException::withMessages(['payment_method' => 'This payment method is already used by recorded payments or refunds. Disable it instead of deleting it.']);
    }
}
