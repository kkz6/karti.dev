<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Actions\SetCatalogueArchived;
use Modules\Billing\Http\Requests\SaveTaxRateRequest;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Tables\TaxRates;
use Modules\Shared\Http\Controllers\BaseController;

class TaxRatesController extends BaseController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', TaxRate::class);
        $request->validate(['search' => ['nullable', 'string', 'max:255']]);

        return Inertia::render('billing::tax-rates/index', ['table' => TaxRates::make()->setRequest($request), 'canCreate' => $request->user()->can('create', TaxRate::class), 'canView' => $request->user()->can('view', new TaxRate)]);
    }

    public function create(Request $request): Response|JsonResponse
    {
        $this->authorize('create', TaxRate::class);

        return $request->expectsJson() ? response()->json((object) []) : Inertia::render('billing::tax-rates/form');
    }

    public function show(Request $request, TaxRate $taxRate): Response|JsonResponse
    {
        $this->authorize('view', $taxRate);

        return $this->form($request, $taxRate, true);
    }

    public function edit(Request $request, TaxRate $taxRate): Response|JsonResponse
    {
        $this->authorize('update', $taxRate);
        abort_if($taxRate->archived_at !== null, 409, 'Restore this tax preset before editing it.');

        return $this->form($request, $taxRate);
    }

    private function form(Request $request, TaxRate $taxRate, bool $readOnly = false): Response|JsonResponse
    {
        $data = ['taxRate' => $taxRate, 'readOnly' => $readOnly, 'can' => [
            'update' => $request->user()->can('update', $taxRate), 'archive' => $request->user()->can('archive', $taxRate), 'restore' => $request->user()->can('restore', $taxRate),
        ], 'message' => $request->session()->get('billing_message')];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::tax-rates/form', $data);
    }

    public function store(SaveTaxRateRequest $request): RedirectResponse
    {
        $taxRate = TaxRate::create($request->validated());

        return $request->header('X-Billing-Modal') === '1' ? redirect()->back(fallback: route('admin.settings.billing.edit', ['section'=>'taxes']))->with('billing_message', 'Tax preset created.') : to_route('admin.tax-rates.show', $taxRate)->with('billing_message', 'Tax preset created.');
    }

    public function update(SaveTaxRateRequest $request, TaxRate $taxRate): RedirectResponse
    {
        DB::transaction(function () use ($request, $taxRate) {
            $locked = TaxRate::whereKey($taxRate->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->archived_at !== null, 409, 'Restore this tax preset before editing it.');
            $locked->update($request->validated());
        });

        return $request->header('X-Billing-Modal') === '1' ? redirect()->back(fallback: route('admin.settings.billing.edit', ['section'=>'taxes']))->with('billing_message', 'Tax preset updated.') : to_route('admin.tax-rates.show', $taxRate)->with('billing_message', 'Tax preset updated.');
    }

    public function destroy(TaxRate $taxRate): RedirectResponse
    {
        $this->authorize('delete', $taxRate);
        try {
            DB::transaction(function () use ($taxRate) {
                $locked = TaxRate::whereKey($taxRate->id)->lockForUpdate()->firstOrFail();
                if ($locked->services()->exists() || \Modules\Billing\Models\InvoiceItemTax::where('tax_rate_id', $locked->id)->exists()) {
                    $this->inUse();
                }
                $locked->delete();
            });
        } catch (QueryException $error) {
            if (in_array((string) ($error->errorInfo[0] ?? ''), ['23000', '23503'], true)) {
                $this->inUse();
            }
            throw $error;
        }

        return back()->with('success', 'Tax preset deleted.');
    }

    private function inUse(): never
    {
        throw ValidationException::withMessages(['tax_preset' => 'This tax preset is used by an invoice or saved service. Archive it instead to preserve existing records.']);
    }

    public function archive(TaxRate $taxRate, SetCatalogueArchived $action): RedirectResponse
    {
        $this->authorize('archive', $taxRate);
        $action->handle($taxRate, true);

        return back()->with('billing_message', 'Tax preset archived.');
    }

    public function restore(TaxRate $taxRate, SetCatalogueArchived $action): RedirectResponse
    {
        $this->authorize('restore', $taxRate);
        $action->handle($taxRate, false);

        return back()->with('billing_message', 'Tax preset restored.');
    }
}
