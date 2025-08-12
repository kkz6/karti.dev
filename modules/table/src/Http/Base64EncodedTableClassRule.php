<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Base64EncodedTableClassRule implements ValidationRule
{
    /**
     * Determine if value is a valid base64 encoded class name.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail(sprintf('The %s must be a string.', $attribute));
        }

        if (preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', (string) $value) === false) {
            $fail(sprintf('The %s must be a valid base64 encoded string.', $attribute));
        }

        if (! class_exists(base64_decode((string) $value))) {
            $fail(sprintf('The %s must be a valid base64 encoded class name.', $attribute));
        }
    }
}
