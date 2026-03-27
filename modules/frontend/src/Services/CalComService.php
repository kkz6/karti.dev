<?php

declare(strict_types=1);

namespace Modules\Frontend\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;

class CalComService
{
    private string $apiKey;
    private string $baseUrl;
    private string $apiVersion;
    private int $eventTypeId;

    public function __construct()
    {
        $this->apiKey = config('services.calcom.api_key');
        $this->baseUrl = config('services.calcom.base_url');
        $this->apiVersion = config('services.calcom.api_version');
        $this->eventTypeId = (int) config('services.calcom.event_type_id');
    }

    /** @return array<string, list<array{start: string, end: string}>> */
    public function getAvailableSlots(string $startDate, string $endDate, string $timezone = 'Asia/Kolkata'): array
    {
        $response = $this->client()->get('slots', [
            'eventTypeId' => $this->eventTypeId,
            'start'       => $startDate,
            'end'         => $endDate,
            'timeZone'    => $timezone,
            'format'      => 'range',
        ]);

        $data = $response->json('data', []);

        return is_array($data) ? $data : [];
    }

    /** @return array{reservationUid: string, slotStart: string, slotEnd: string} */
    public function reserveSlot(string $slotStart): array
    {
        $response = $this->client()->post('slots', [
            'eventTypeId' => $this->eventTypeId,
            'slotStart'   => $slotStart,
            'slotDuration' => 60,
        ]);

        return $response->json('data', []);
    }

    /** @return array<string, mixed> */
    public function createBooking(string $slotStart, string $name, string $email, string $timezone, array $metadata = []): array
    {
        $response = $this->client()->post('bookings', [
            'start'       => $slotStart,
            'eventTypeId' => $this->eventTypeId,
            'attendee'    => [
                'name'     => $name,
                'email'    => $email,
                'timeZone' => $timezone,
            ],
            'metadata' => $metadata,
        ]);

        return $response->json('data', []);
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders([
                'Authorization'   => "Bearer {$this->apiKey}",
                'cal-api-version' => $this->apiVersion,
            ])
            ->acceptJson()
            ->throw();
    }
}
