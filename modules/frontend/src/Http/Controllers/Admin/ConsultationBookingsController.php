<?php

declare(strict_types=1);

namespace Modules\Frontend\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Shared\Http\Controllers\BaseController;

class ConsultationBookingsController extends BaseController
{
    public function index(): Response
    {
        $bookings = ConsultationBooking::latest()->get();

        return Inertia::render('frontend::admin/bookings', [
            'bookings' => $bookings,
        ]);
    }
}
