<?php

namespace Modules\Frontend\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Modules\Frontend\Events\ContactSubmissionReceived;
use Modules\Frontend\Mail\NewContactSubmission;
use Modules\Settings\Models\SiteSetting;
use Modules\Settings\Support\EmailConfiguration;

class SendContactSubmissionNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(private readonly EmailConfiguration $configuration) {}

    public function handle(ContactSubmissionReceived $event): void
    {
        $recipient = $this->recipient();

        if ($recipient === null) {
            return;
        }

        $this->configuration->run(fn () => Mail::to($recipient)->send(new NewContactSubmission($event->submission)));
        $event->submission->update(['notified_at' => now()]);
    }

    private function recipient(): ?string
    {
        $recipient = (string) config('contact.notification_email', '');

        if ($recipient === '' && Schema::hasTable('site_settings')) {
            $recipient = (string) SiteSetting::query()->where('key', 'contact_email')->value('value');
        }

        if ($recipient === '') {
            $recipient = (string) config('mail.from.address', '');
        }

        return filter_var($recipient, FILTER_VALIDATE_EMAIL) ? $recipient : null;
    }
}
