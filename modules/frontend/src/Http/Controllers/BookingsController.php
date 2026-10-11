<?php

declare(strict_types=1);

namespace Modules\Frontend\Http\Controllers;

use Carbon\Carbon;
use Dodopayments\Client as DodoClient;
use Dodopayments\Payments\BillingAddress;
use Dodopayments\Payments\NewCustomer;
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
            'timezone'   => ['sometimes', 'timezone'],
        ]);

        if (\Carbon\CarbonImmutable::parse($request->input('start_date'))->diffInDays(\Carbon\CarbonImmutable::parse($request->input('end_date'))) > 31) {
            throw \Illuminate\Validation\ValidationException::withMessages(['end_date' => 'Choose an availability range of at most 31 days.']);
        }
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
            'slot_start' => ['required', 'date', 'after:now'],
            'timezone'   => ['required', 'timezone'],
        ]);

        abort_unless(config('services.dodo_payments.api_key') && config('services.dodo_payments.product_id'), 503, 'Consultation checkout is not configured.');
        $returnToken = bin2hex(random_bytes(32));
        $slotStart   = $request->input('slot_start');

        // Try to reserve the slot on Cal.com (best-effort)
        $reservationUid = null;

        try {
            $reservation    = $this->calComService->reserveSlot($slotStart);
            $reservationUid = $reservation['reservationUid'] ?? null;
        } catch (\Exception $e) {
            report($e);
        }

        // Create booking record in DB as pending
        $booking = ConsultationBooking::create([
            'name'              => $request->input('name'),
            'email'             => $request->input('email'),
            'profession'        => $request->input('profession'),
            'message'           => $request->input('message', ''),
            'timezone'          => $request->input('timezone'),
            'slot_start'        => $slotStart,
            'slot_end'          => Carbon::parse($slotStart)->addHour()->toISOString(),
            'return_token_hash' => hash('sha256', $returnToken),
            'status'            => 'pending',
            'reservation_uid'   => $reservationUid,
        ]);

        // Create Dodo payment
        $dodo = new DodoClient(
            bearerToken: config('services.dodo_payments.api_key'),
            baseUrl: config('services.dodo_payments.test_mode')
                ? 'https://test.dodopayments.com'
                : 'https://live.dodopayments.com',
        );

        $payment = $dodo->payments->create(
            billing: BillingAddress::with(country: 'IN'),
            customer: NewCustomer::with(
                email: $request->input('email'),
                name: $request->input('name'),
            ),
            productCart: [
                ['product_id' => config('services.dodo_payments.product_id'), 'quantity' => 1],
            ],
            paymentLink: true,
            returnURL: route('upwork.bookingConfirmed', ['booking' => $booking->id, 'token' => $returnToken]),
            redirectImmediately: true,
            metadata: [
                'booking_id' => (string) $booking->id,
                'slot_start' => $slotStart,
                'timezone'   => $request->input('timezone'),
            ],
        );

        $verified = $dodo->payments->retrieve($payment->paymentID);
        $booking->update([
            'expected_amount_minor' => $payment->totalAmount, 'expected_currency' => $verified->currency,
            'payment_id'            => $payment->paymentID,
            'payment_link'          => $payment->paymentLink,
        ]);

        return response()->json(['payment_link' => $payment->paymentLink]);
    }

    public function bookingConfirmed(Request $request): InertiaResponse
    {
        $booking=ConsultationBooking::find($request->query('booking'));
        $token  =$request->query('token');
        abort_unless($booking && is_string($token) && strlen($token) === 64 && $booking->return_token_hash && hash_equals($booking->return_token_hash, hash('sha256', $token)), 404);

        return Inertia::render('billing::booking-return', ['state'=>$booking->isConfirmed() && $booking->fulfillment_state === 'confirmed' ? 'confirmed' : ($booking->isPending() ? 'pending' : $booking->status), 'needsReview'=>$booking->fulfillment_state === 'uncertain', 'name'=>$booking->name, 'slotStart'=>$booking->slot_start?->toIso8601String()]);
    }
}
