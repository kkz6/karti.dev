<?php

namespace Modules\Billing\Services;

class InvoiceText
{
    /** Compact legacy HTML-conversion spacing without rewriting stored history. */
    public static function description(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        // Perfex's <br> followed by a Windows newline became LF + CRLF during
        // import. Treat that as one break, but preserve ordinary CRLF paragraphs.
        $text = preg_replace('/(?<!\r)\n\r\n/', "\n", $text);
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/^[\t \x{00A0}]+$/mu', '', $text);

        return trim(preg_replace('/\n{3,}/', "\n\n", $text));
    }
}
