<?php

namespace Modules\Billing\Contracts;

interface InvoicePdfRenderer
{
    public function render(array $data): string;
}
