<?php

namespace Modules\Billing\Http\Controllers;

use DateTimeZone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\UpdateBillingSettingsRequest;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\Currencies;
use Modules\Shared\Http\Controllers\BaseController;

class BillingSettingsController extends BaseController
{
    public function edit(Request $request, BillingSettings $settings): Response
    {
        $section = $request->query('section', 'company');
        abort_unless(in_array($section, ['company', 'automation', 'online', 'imports', 'taxes', 'delivery'], true), 404);
        if ($section === 'company' && ! $request->user()->can('view', BillingSettings::class) && ($request->user()->hasRole('super-admin') || $request->user()->can('import billing data'))) {
            $section = 'imports';
        }
        if ($section === 'company' && ! $request->user()->can('view', BillingSettings::class) && $request->user()->can('viewAny', \Modules\Billing\Models\TaxRate::class)) {
            $section='taxes';
        }
        if ($section === 'delivery') {
            return app(BillingDeliverySettingsController::class)->edit($request);
        }
        if ($section === 'taxes') {
            return app(TaxRatesController::class)->index($request);
        }
        if ($section === 'automation') {
            return app(BillingAutomationController::class)->edit($request);
        }
        if ($section === 'online') {
            return app(OnlinePaymentsController::class)->settings($request);
        }
        if ($section === 'imports') {
            return app(BillingImportsController::class)->index($request);
        }

        $this->authorize('view', BillingSettings::class);

        return Inertia::render('billing::settings', [
            'paymentMethods' => \Modules\Billing\Support\PaymentMethods::options(false),
            'settings'       => $settings->toArray(), 'currencies' => Currencies::options(), 'timezones' => DateTimeZone::listIdentifiers(),
            'canUpdate'      => $request->user()->can('update', BillingSettings::class), 'saved' => $request->session()->get('billing_settings_saved', false),
        ]);
    }

    public function update(UpdateBillingSettingsRequest $request, BillingSettings $settings): RedirectResponse
    {
        $data = $request->validated();
        foreach ($data as $key => $value) {
            if ($value === null && $key !== 'logo_media_id') {
                $data[$key] = '';
            }
        }
        $settings->fill($data)->save();

        return to_route('admin.settings.billing.edit')->with('billing_settings_saved', true);
    }
}
