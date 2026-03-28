<?php

declare(strict_types=1);

namespace Modules\Frontend\Http\Controllers;

use Dodopayments\Client as DodoClient;
use Dodopayments\Payments\BillingAddress;
use Dodopayments\Payments\NewCustomer;
use Dodopayments\Payments\PaymentCreateParams;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Frontend\Services\CalComService;
use Modules\Shared\Http\Controllers\BaseController;

class BookingsController extends BaseController
{
    public function __construct(
        private readonly CalComService $calComService
    ) {}

    public function getSlots(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
            'timezone'   => ['sometimes', 'string'],
        ]);

        $slots = $this->calComService->getAvailableSlots(
            $request->input('start_date'),
            $request->input('end_date'),
            $request->input('timezone', 'Asia/Kolkata'),
        );

        return response()->json(['slots' => $slots]);
    }

    public function createPayment(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255'],
            'profession' => ['required', 'string', 'max:255'],
            'message'    => ['nullable', 'string', 'max:2000'],
            'slot_start' => ['required', 'string'],
            'timezone'   => ['required', 'string'],
        ]);

        $name      = $request->input('name');
        $email     = $request->input('email');
        $slotStart = $request->input('slot_start');
        $timezone  = $request->input('timezone');

        // Try to reserve the slot (best-effort, non-blocking)
        try {
            $this->calComService->reserveSlot($slotStart);
        } catch (\Exception $e) {
            report($e);
        }

        session([
            'booking_name'       => $name,
            'booking_email'      => $email,
            'booking_profession' => $request->input('profession'),
            'booking_message'    => $request->input('message', ''),
            'booking_slot_start' => $slotStart,
            'booking_timezone'   => $timezone,
        ]);

        $dodo = new DodoClient(
            bearerToken: config('services.dodo_payments.api_key'),
        );

        $payment = $dodo->payments->create(
            PaymentCreateParams::with(
                billing: BillingAddress::with(country: 'IN'),
                customer: NewCustomer::with(email: $email, name: $name),
                productCart: [
                    ['product_id' => config('services.dodo_payments.product_id'), 'quantity' => 1],
                ],
                paymentLink: true,
                returnURL: route('upwork.bookingConfirmed'),
                redirectImmediately: true,
                metadata: [
                    'slot_start' => $slotStart,
                    'timezone'   => $timezone,
                    'profession' => $request->input('profession'),
                ],
            ),
        );

        session(['booking_payment_id' => $payment->paymentID]);

        return response()->json(['payment_link' => $payment->paymentLink]);
    }

    public function bookingConfirmed(Request $request): InertiaResponse
    {
        $name      = session('booking_name');
        $email     = session('booking_email');
        $slotStart = session('booking_slot_start');
        $timezone  = session('booking_timezone');
        $paymentId = session('booking_payment_id');

        $bookingDetails = null;

        if ($name && $email && $slotStart && $timezone) {
            try {
                $bookingDetails = $this->calComService->createBooking(
                    $slotStart,
                    $name,
                    $email,
                    $timezone,
                    ['payment_id' => $paymentId ?? ''],
                );
            } catch (\Exception $e) {
                report($e);
            }

            session()->forget([
                'booking_name', 'booking_email', 'booking_profession',
                'booking_message', 'booking_slot_start', 'booking_timezone',
                'booking_payment_id',
            ]);
        }

        return Inertia::render('frontend::upwork-booking-confirmed', [
            'booking'   => $bookingDetails,
            'name'      => $name,
            'email'     => $email,
            'slotStart' => $slotStart,
            'timezone'  => $timezone,
            'paymentId' => $paymentId,
        ]);
    }
}
