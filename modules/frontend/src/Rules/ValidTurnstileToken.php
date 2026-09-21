<?php

namespace Modules\Frontend\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Modules\Frontend\Services\Turnstile;

class ValidTurnstileToken implements ValidationRule
{
    public function __construct(private readonly string $action = 'contact') {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $turnstile = app(Turnstile::class);

        if (! $turnstile->verify((string) $value, request()->ip(), $this->action)) {
            $fail('We could not confirm this submission. Please complete the security check and try again.');
        }
    }
}
