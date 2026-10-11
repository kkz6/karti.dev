<?php

namespace Modules\Billing\Mail;

use Illuminate\Mail\Mailable;

class InvoiceEmail extends Mailable
{
    public function __construct(public string $invoiceNumber, public string $emailMessage, public ?string $invoiceUrl, public string $pdfBytes, public string $pdfName, public string $emailSubject) {}

    public function build(): self
    {
        return $this->subject($this->emailSubject)->view('billing::mail.invoice')->attachData($this->pdfBytes, $this->pdfName, ['mime' => 'application/pdf']);
    }
}
