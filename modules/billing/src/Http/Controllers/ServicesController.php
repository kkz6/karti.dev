<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Actions\SaveService;
use Modules\Billing\Actions\SetCatalogueArchived;
use Modules\Billing\Http\Requests\SaveServiceRequest;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\Currencies;
use Modules\Billing\Tables\Services;
use Modules\Shared\Http\Controllers\BaseController;

class ServicesController extends BaseController
{
    public function index(Request $request): Response|JsonResponse
    {
        $this->authorize('viewAny', Service::class);
        $request->validate(['search' => ['nullable', 'string', 'max:255']]);

        return Inertia::render('billing::services/index', ['table' => Services::make()->setRequest($request), 'canCreate' => $request->user()->can('create', Service::class)]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Service::class);
        $data  = $request->validate(['currency' => ['required', Rule::in(Currencies::codes())], 'search' => ['nullable', 'string', 'max:255']]);
        $query = Service::whereNull('archived_at')->where('currency', $data['currency'])->with(['taxRates' => fn ($query) => $query->whereNull('archived_at')]);
        if ($search = $data['search'] ?? '') {
            $query->whereRaw("name LIKE ? ESCAPE '!'", ['%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%']);
        }

        return response()->json(['services' => $query->orderBy('name')->limit(25)->get()->map(fn ($service) => [
            'id'        => $service->id, 'name' => $service->name, 'description' => $service->description, 'unit' => $service->unit, 'rate' => $service->rate, 'currency' => $service->currency,
            'tax_rates' => $service->taxRates->map(fn ($tax) => ['id' => $tax->id, 'name' => $tax->name, 'percentage' => $tax->percentage]),
        ])]);
    }

    public function create(Request $request): Response|JsonResponse
    {
        $this->authorize('create', Service::class);

        return $this->form($request);
    }

    public function show(Request $request, Service $service): Response|JsonResponse
    {
        $this->authorize('view', $service);

        return $this->form($request, $service, true);
    }

    public function edit(Request $request, Service $service): Response|JsonResponse
    {
        $this->authorize('update', $service);
        abort_if($service->archived_at !== null, 409, 'Restore this service before editing it.');

        return $this->form($request, $service);
    }

    private function form(Request $request, ?Service $service = null, bool $readOnly = false): Response|JsonResponse
    {
        $ids = $service ? $service->taxRates()->pluck('billing_tax_rates.id')->all() : [];

        $data=[
            'service'         => $service?->load('taxRates'), 'currencies' => Currencies::options(),
            'defaultCurrency' => app(BillingSettings::class)->default_currency,
            'taxRates'        => TaxRate::where(fn ($query) => $query->whereNull('archived_at')->orWhereIn('id', $ids))->orderBy('name')->get(),
            'readOnly'        => $readOnly,
            'can'             => ['update' => $service && $request->user()->can('update', $service), 'archive' => $service && $request->user()->can('archive', $service), 'restore' => $service && $request->user()->can('restore', $service)],
            'message'         => $request->session()->get('billing_message'),
        ];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::services/form', $data);
    }

    public function store(SaveServiceRequest $request, SaveService $action): RedirectResponse
    {
        $service = $action->handle($request->validated());

        return $request->header('X-Billing-Modal') === '1' ? to_route('admin.services.index')->with('billing_message', 'Service created.') : to_route('admin.services.show', $service)->with('billing_message', 'Service created.');
    }

    public function update(SaveServiceRequest $request, Service $service, SaveService $action): RedirectResponse
    {
        $action->handle($request->validated(), $service);

        return to_route('admin.services.show', $service)->with('billing_message', 'Service updated.');
    }

    public function archive(Service $service, SetCatalogueArchived $action): RedirectResponse
    {
        $this->authorize('archive', $service);
        $action->handle($service, true);

        return back()->with('billing_message', 'Service archived.');
    }

    public function restore(Service $service, SetCatalogueArchived $action): RedirectResponse
    {
        $this->authorize('restore', $service);
        $action->handle($service, false);

        return back()->with('billing_message', 'Service restored.');
    }
}
