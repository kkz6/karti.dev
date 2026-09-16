<?php

namespace Modules\Frontend\Mail;

use Illuminate\Mail\Mailable;
use Modules\Frontend\Models\NewsletterSubscriber;

class ConfirmNewsletterSubscription extends Mailable
{
    public function __construct(public NewsletterSubscriber $subscriber) {}

    public function build(): static
    {
        return $this->subject('Confirm your newsletter subscription')
            ->markdown('frontend::mail.newsletter-confirm', [
                'confirmationUrl' => $this->subscriber->confirmationUrl(),
                'unsubscribeUrl'  => $this->subscriber->unsubscribeUrl(),
            ]);
    }
}
