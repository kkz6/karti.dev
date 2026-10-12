<?php

namespace Modules\Billing\Contracts;

use Illuminate\Http\Request;

/** Implement in a Composer package and register from its auto-discovered service provider. */
interface PaymentGateway
{
    public function id(): string;

    public function name(): string;

    public function providerClass(): string;

    /** key => ['label'=>string, 'type'=>'text'|'password'|'checkbox', 'required'=>bool, 'default'=>mixed] */
    public function fields(): array;

    public function checkoutHosts(): array;

    /** Verify the raw signature before returning normalized event_id/event_type/payload. */
    public function verifyWebhook(Request $request): array;
}
