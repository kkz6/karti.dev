<?php

namespace Modules\Frontend\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Modules\Frontend\Models\ContactSubmission;

class NewContactSubmission extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactSubmission $submission) {}

    public function build(): self
    {
        return $this->subject('New contact message: '.$this->submission->subject)
            ->replyTo($this->submission->email, $this->submission->name)
            ->markdown('frontend::mail.contact-submission', [
                'submission' => $this->submission,
                'adminUrl'   => route('admin.contact.show', $this->submission),
            ]);
    }
}
