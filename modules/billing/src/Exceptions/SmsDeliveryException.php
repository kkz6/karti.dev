<?php

namespace Modules\Billing\Exceptions;

use RuntimeException;

class SmsDeliveryException extends RuntimeException
{
    public function __construct(string $message, public bool $uncertain = false)
    {
        parent::__construct($message);
    }
}
