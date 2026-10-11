<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Http\Requests\SaveCustomerRequest;
use Modules\Billing\Models\Customer;
use Modules\Billing\Tables\Customers;
use Modules\Shared\Http\Controllers\BaseController;

class CustomersController extends BaseController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Customer::class);
        $request->validate(['search' => ['nullable', 'string', 'max:255']]);

        return Inertia::render('billing::customers/index', [
            'table'     => Customers::make()->setRequest($request),
            'canCreate' => $request->user()->can('create', Customer::class),
        ]);
    }

    public function create(Request $request): Response|JsonResponse
    {
        $this->authorize('create', Customer::class);

        $data=['currencies'=>\Modules\Billing\Support\Currencies::options()];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::customers/form', $data);
    }

    public function store(SaveCustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        if ($request->header('X-Billing-Modal') === '1') {
            return to_route('admin.customers.index')->with('billing_message', 'Customer created.');
        }

        return redirect()->route('admin.customers.show', $customer)->with('billing_message', 'Customer created.');
    }

    public function show(Request $request, Customer $customer): Response
    {
        $this->authorize('view', $customer);

        return Inertia::render('billing::customers/show', [
            'canStatement' => $request->user()->hasRole('super-admin') || $request->user()->can('view statement'),
            'financials'   => $request->user()->can('viewAny', \Modules\Billing\Models\Invoice::class) && $request->user()->can('view', new \Modules\Billing\Models\Invoice) ? app(\Modules\Billing\Services\InvoiceBalance::class)->customerData($customer->id, $request->user()->can('view', new \Modules\Billing\Models\Payment)) : null,
            'customer'     => $customer->load('contacts'),
            'can'          => [
                'update'  => $request->user()->can('update', $customer),
                'archive' => $request->user()->can('archive', $customer),
                'restore' => $request->user()->can('restore', $customer),
            ],
            'message' => $request->session()->get('billing_message'),
        ]);
    }

    public function edit(Customer $customer): Response
    {
        $this->authorize('update', $customer);
        abort_if($customer->archived_at !== null, 409, 'Restore this customer before editing it.');

        return Inertia::render('billing::customers/form', ['customer' => $customer, 'currencies'=>\Modules\Billing\Support\Currencies::options()]);
    }

    public function update(SaveCustomerRequest $request, Customer $customer): RedirectResponse
    {
        DB::transaction(function () use ($customer, $request) {
            $locked = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->archived_at !== null, 409, 'Restore this customer before editing it.');
            $locked->update($request->validated());
        });

        if ($request->header('X-Billing-Modal') === '1') {
            return to_route('admin.customers.index')->with('billing_message', 'Customer created.');
        }

        return redirect()->route('admin.customers.show', $customer)->with('billing_message', 'Customer updated.');
    }

    public function archive(Customer $customer): RedirectResponse
    {
        $this->authorize('archive', $customer);
        $this->setArchived($customer, true);

        return back()->with('billing_message', 'Customer archived. Their details and contacts are preserved.');
    }

    public function restore(Customer $customer): RedirectResponse
    {
        $this->authorize('restore', $customer);
        $this->setArchived($customer, false);

        return back()->with('billing_message', 'Customer restored.');
    }

    private function setArchived(Customer $customer, bool $archive): void
    {
        DB::transaction(function () use ($customer, $archive) {
            $locked              = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            $locked->archived_at = $archive ? ($locked->archived_at ?? now()) : null;
            $locked->save();
        });
    }
}
