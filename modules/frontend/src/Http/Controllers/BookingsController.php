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
use Modules\Frontend\Models\ConsultationBooking;
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

        $slotStart = $request->input('slot_start');

        // Try to reserve the slot on Cal.com (best-effort)
        $reservationUid = null;

        try {
            $reservation = $this->calComService->reserveSlot($slotStart);
            $reservationUid = $reservation['reservationUid'] ?? null;
        } catch (\Exception $e) {
            report($e);
        }

        // Create booking record in DB as pending
        $booking = ConsultationBooking::create([
            'name'            => $request->input('name'),
            'email'           => $request->input('email'),
            'profession'      => $request->input('profession'),
            'message'         => $request->input('message', ''),
            'timezone'        => $request->input('timezone'),
            'slot_start'      => $slotStart,
            'slot_end'        => date('c', strtotime($slotStart) + 3600),
            'status'          => 'pending',
            'reservation_uid' => $reservationUid,
        ]);

        // Create Dodo payment
        $dodo = new DodoClient(
            bearerToken: config('services.dodo_payments.api_key'),
        );

        $payment = $dodo->payments->create(
            PaymentCreateParams::with(
                billing: BillingAddress::with(country: 'IN'),
                customer: NewCustomer::with(
                    email: $request->input('email'),
                    name: $request->input('name'),
                ),
                productCart: [
                    ['product_id' => config('services.dodo_payments.product_id'), 'quantity' => 1],
                ],
                paymentLink: true,
                returnURL: route('upwork.bookingConfirmed', ['booking' => $booking->id]),
                redirectImmediately: true,
                metadata: [
                    'booking_id' => (string) $booking->id,
                    'slot_start' => $slotStart,
                    'timezone'   => $request->input('timezone'),
                ],
            ),
        );

        $booking->update([
            'payment_id'   => $payment->paymentID,
            'payment_link' => $payment->paymentLink,
        ]);

        return response()->json(['payment_link' => $payment->paymentLink]);
    }

    public function bookingConfirmed(Request $request): InertiaResponse
    {
        $booking = ConsultationBooking::find($request->query('booking'));

        if (! $booking || ! $booking->isPending()) {
            return Inertia::render('frontend::upwork-booking-confirmed', [
                'booking'   => null,
                'name'      => $booking?->name,
                'email'     => $booking?->email,
                'slotStart' => $booking?->slot_start?->toISOString(),
                'timezone'  => $booking?->timezone,
                'paymentId' => $booking?->payment_id,
                'alreadyConfirmed' => $booking?->isConfirmed(),
            ]);
        }

        // Confirm the Cal.com booking
        $calcomData = null;
        $calcomBookingUid = null;

        try {
            $calcomData = $this->calComService->createBooking(
                $booking->slot_start->toISOString(),
                $booking->name,
                $booking->email,
                $booking->timezone,
                ['payment_id' => $booking->payment_id ?? '', 'booking_id' => (string) $booking->id],
            );
            $calcomBookingUid = $calcomData['uid'] ?? null;
        } catch (\Exception $e) {
            report($e);
        }

        $booking->markConfirmed($calcomBookingUid, $calcomData);

        return Inertia::render('frontend::upwork-booking-confirmed', [
            'booking'   => $calcomData,
            'name'      => $booking->name,
            'email'     => $booking->email,
            'slotStart' => $booking->slot_start->toISOString(),
            'timezone'  => $booking->timezone,
            'paymentId' => $booking->payment_id,
        ]);
    }
}
