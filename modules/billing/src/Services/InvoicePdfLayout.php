<?php

namespace Modules\Billing\Services;

class InvoicePdfLayout
{
    /** Explicit bounded lines prevent oversized table cells and long unbroken tokens. */
    public static function lines(?string $text, int $width = 90): array
    {
        static $metrics = null;
        $metrics ??= (new \Dompdf\Dompdf(BillingPdfFonts::options()))->getFontMetrics();
        $font  = $metrics->getFont('FreeSans', 'bold');
        $fits  = fn (string $value) => mb_strlen($value) <= $width && $metrics->getTextWidth($value, $font, 10) <= $width * 5.2;
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
        $width  = $large ? 32 : ($hasTax ? 40 : 52);
        $rows   = [];
        foreach ($items as $i => $item) {
            $main   = self::lines($item['description'], $width);
            $detail = self::lines($item['additional_description'] ?? '', $width);
            $fits   = count($main) + count($detail) <= 18;
            $rows[] = ['item' => $item, 'number' => $i + 1, 'continued' => false, 'lines' => array_slice($main, 0, 18), 'detailLines' => $fits ? $detail : []];
            $tail   = implode("\n", array_slice($main, 18));
            if (! $fits && ($item['additional_description'] ?? '')) {
                $tail .= ($tail ? "\n" : '').$item['additional_description'];
            }
            if ($tail !== '') {
                foreach (array_chunk(self::lines($tail), 18) as $lines) {
                    $rows[] = ['item' => $item, 'number' => $i + 1, 'continued' => true, 'lines' => $lines];
                }
            }
        }

        return $rows;
    }
}
