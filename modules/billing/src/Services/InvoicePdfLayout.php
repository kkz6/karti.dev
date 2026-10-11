<?php

namespace Modules\Billing\Services;

class InvoicePdfLayout
{
    /** Explicit bounded lines prevent oversized table cells and long unbroken tokens. */
    public static function lines(?string $text, int $width = 90, ?float $points = null, bool $bold = true): array
    {
        static $metrics = null;
        $metrics ??= (new \Dompdf\Dompdf(BillingPdfFonts::options()))->getFontMetrics();
        $font  = $metrics->getFont('FreeSans', $bold ? 'bold' : 'normal');
        $fits  = fn (string $value) => mb_strlen($value) <= $width && $metrics->getTextWidth($value, $font, 10) <= ($points ?? $width * 5.2);
        $lines = [];
        foreach (explode("\n", str_replace(["\r\n", "\r"], "\n", $text ?? '')) as $paragraph) {
            if ($paragraph === '') {
                $lines[] = '';

                continue;
            }
            $line = '';
            foreach (preg_split('/\s+/u', $paragraph, -1, PREG_SPLIT_NO_EMPTY) as $word) {
                $parts = [];
                $part  = '';
                foreach (mb_str_split($word) as $character) {
                    if ($part !== '' && ! $fits($part.$character)) {
                        $parts[] = $part;
                        $part    = '';
                    }
                    $part .= $character;
                }
                if ($part !== '') {
                    $parts[] = $part;
                }
                foreach ($parts as $part) {
                    if ($line !== '' && ! $fits($line.' '.$part)) {
                        $lines[] = $line;
                        $line    = '';
                    }
                    $line .= ($line !== '' ? ' ' : '').$part;
                }
            }
            $lines[] = $line;
        }

        return $lines;
    }

    public static function party(array $snapshot, bool $customer = false): array
    {
        $prefix = $customer ? 'billing_' : '';
        $lines  = self::lines(($snapshot['legal_name'] ?? '') ?: ($snapshot['display_name'] ?? ''), 42);
        foreach (['address', 'address_line_2', 'city', 'state', 'postal_code', 'country'] as $field) {
            if ($value = $snapshot[$prefix.$field] ?? '') {
                $lines = [...$lines, ...self::lines($value, 42)];
            }
        }
        foreach (['tax_identifier' => 'Tax ID: ', 'email' => '', 'phone' => 'Phone: '] as $field => $label) {
            if ($value = $snapshot[$field] ?? '') {
                $lines = [...$lines, ...self::lines($label.$value, 42)];
            }
        }

        return $lines;
    }

    public static function amount(string $amount, string $currency): string
    {
        $symbols = ['INR' => '₹', 'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'AUD' => 'A$', 'CAD' => 'C$', 'SGD' => 'S$', 'JPY' => '¥', 'AED' => 'AED ', 'CHF' => 'CHF '];
        $parts   = explode('.', $amount);
        $number  = preg_replace('/\B(?=(\d{3})+(?!\d))/', ',', $parts[0]).(isset($parts[1]) ? '.'.$parts[1] : '');

        return ($symbols[$currency] ?? $currency.' ').$number;
    }

    public static function words(string $amount, string $currency): string
    {
        $small   = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        $tens    = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        $triplet = function (int $n) use ($small, $tens): string {
            $parts = [];
            if ($n >= 100) {
                $parts[] = $small[intdiv($n, 100)].' Hundred';
                $n %= 100;
            }
            if ($n >= 20) {
                $parts[] = $tens[intdiv($n, 10)].($n % 10 ? ' '.$small[$n % 10] : '');
            } elseif ($n > 0) {
                $parts[] = $small[$n];
            }

            return implode(' ', $parts);
        };
        [$integer, $fraction] = array_pad(explode('.', $amount), 2, '');
        $groups               = str_split(str_pad($integer, (int) ceil(strlen($integer) / 3) * 3, '0', STR_PAD_LEFT), 3);
        $scales               = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion'];
        $parts                = [];
        foreach ($groups as $i => $group) {
            if ((int) $group) {
                $parts[] = trim($triplet((int) $group).' '.$scales[count($groups) - $i - 1]);
            }
        }
        $units = ['INR' => 'Rupees', 'USD' => 'Dollars', 'EUR' => 'Euros', 'GBP' => 'Pounds', 'AUD' => 'Australian Dollars', 'CAD' => 'Canadian Dollars', 'SGD' => 'Singapore Dollars', 'JPY' => 'Yen', 'AED' => 'Dirhams', 'CHF' => 'Swiss Francs'];
        $text  = ($parts ? implode(' ', $parts) : 'Zero').' '.($units[$currency] ?? $currency);
        if ((int) $fraction > 0) {
            $text .= ' And '.$triplet((int) $fraction).' '.($currency === 'INR' ? 'Paise' : ($currency === 'GBP' ? 'Pence' : 'Cents'));
        }

        return $text;
    }

    public static function rate(string $rate, int $precision): string
    {
        $decimal = \Brick\Math\BigDecimal::of($rate)->stripTrailingZeros();

        return (string) $decimal->toScale(max($precision, $decimal->getScale()));
    }

    public static function rows(array $items): array
    {
        $hasTax = collect($items)->contains(fn ($item) => count($item['taxes']) > 0);
        $large  = collect($items)->contains(fn ($item) => strlen($item['gross']) > 14 || strlen($item['rate']) > 13);
        // A4 minus 36pt margins and the item cell's horizontal padding.
        $points = (595.28 - 72) * ($large ? 0.36 : ($hasTax ? 0.46 : 0.58)) - 18;
        $rows   = [];
        foreach ($items as $i => $item) {
            $main        = self::lines(preg_replace('/\s+/u', ' ', trim($item['description'])), 256, $points);
            $description = InvoiceText::description($item['additional_description'] ?? null);
            $detail      = $description ? self::lines($description, 256, $points, false) : [];
            $content     = [
                ...array_map(fn ($line) => ['text' => $line, 'bold' => true], $main),
                ...array_map(fn ($line) => ['text' => $line, 'bold' => false], $detail),
            ];
            // Small rows let Dompdf paginate naturally without moving the whole
            // description to another page or changing its column width.
            foreach (array_chunk($content, 4) as $part => $lines) {
                $rows[] = [
                    'item'      => $item, 'number' => $i + 1,
                    'continued' => $part > 0,
                    'last'      => ($part + 1) * 4 >= count($content),
                    'content'   => $lines,
                ];
            }
        }

        return $rows;
    }
}
