<?php

namespace Modules\Settings\Mail;

use Illuminate\Mail\Mailable;

class EmailDeliveryTest extends Mailable
{
    public function __construct(public readonly string $provider) {}

    public function build(): self
    {
        $provider = $this->provider === 'resend' ? 'Resend' : 'SMTP';

        return $this
            ->subject('Email delivery test')
            ->html(sprintf(
                '<h1>Email delivery is working</h1><p>This message was sent through your saved %s configuration.</p>',
                $provider,
            ));
    }
}
