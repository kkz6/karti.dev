<?php

namespace Modules\Analytics\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Analytics\Services\DashboardOverview;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\BillingDashboard;

class DashboardController extends Controller
{
    public function index(DashboardOverview $overview, BillingDashboard $billing): Response
    {
        return Inertia::render('dashboard', [
            'overview'         => $overview->get(),
            'billing'          => Gate::allows('viewAny', Invoice::class) ? $billing->get() : null,
            'canCreateInvoice' => Gate::allows('create', Invoice::class),
        ]);
    }
}
