<?php

namespace Modules\Frontend\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Modules\Frontend\Mail\ConfirmNewsletterSubscription;
use Modules\Frontend\Models\NewsletterSubscriber;
use Modules\Settings\Support\EmailConfiguration;

class SendNewsletterConfirmation implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public string $subscriberId, public string $confirmationKey) {}

    public function handle(EmailConfiguration $configuration): void
    {
        $subscriber = NewsletterSubscriber::find($this->subscriberId);
        if (! $subscriber || $subscriber->confirmed_at || $subscriber->unsubscribed_at
            || ! hash_equals($subscriber->confirmation_key, $this->confirmationKey)) {
            return;
        }

        $configuration->run(fn () => Mail::to($subscriber->email)->send(new ConfirmNewsletterSubscription($subscriber)));
        $subscriber->update(['confirmation_sent_at' => now()]);
    }
}
