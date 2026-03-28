<?php

declare(strict_types=1);

namespace Modules\Frontend\Console\Commands;

use Illuminate\Console\Command;
use Modules\Frontend\Models\ConsultationBooking;

class ExpireStaleBookingsCommand extends Command
{
    protected $signature = 'bookings:expire-stale';

    protected $description = 'Expire pending consultation bookings older than 30 minutes';

    public function handle(): void
    {
        $stale = ConsultationBooking::pending()
            ->where('created_at', '<', now()->subMinutes(30))
            ->get();

        if ($stale->isEmpty()) {
            $this->comment('No stale bookings found.');

            return;
        }

        $stale->each(function (ConsultationBooking $booking) {
            $this->info("Expiring booking #{$booking->id} for {$booking->email}...");
            $booking->markExpired();
        });

        $this->comment("Expired {$stale->count()} stale bookings.");
    }
}
