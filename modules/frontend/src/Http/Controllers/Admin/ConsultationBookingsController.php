<?php

declare(strict_types=1);

namespace Modules\Frontend\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Shared\Http\Controllers\BaseController;

class ConsultationBookingsController extends BaseController
{
    public function index(\Illuminate\Http\Request $request): Response
    {
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('view payment reconciliation'), 403);
        $bookings = ConsultationBooking::latest()->get();

        return Inertia::render('frontend::admin/bookings', [
            'bookings'     => $bookings,
            'customers'    => $request->user()->can('viewAny', \Modules\Billing\Models\Customer::class) ? \Modules\Billing\Models\Customer::whereNull('archived_at')->orderBy('display_name')->limit(100)->get(['id', 'display_name']) : [],
            'canAssociate' => $request->user()->hasRole('super-admin') || $request->user()->can('link consultation customer'),
        ]);
    }
}
