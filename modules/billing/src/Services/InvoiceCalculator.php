<?php

namespace Modules\Billing\Services;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Brick\Math\RoundingMode;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Support\Currencies;

class InvoiceCalculator
{
    public const MAX_MINOR = '100000000000000000';

    public static function money(int|string $minor, int $precision): string
    {
        return (string) BigDecimal::of($minor)->withPointMovedLeft($precision)->toScale($precision);
    }

    public function calculate(array $data): array
    {
        if (! isset(Currencies::DEFINITIONS[$data['currency']])) {
            throw ValidationException::withMessages(['currency' => 'Choose a supported currency.']);
        }
        $precision = Currencies::DEFINITIONS[$data['currency']]['precision'];
        $gross     = array_map(fn ($item) => BigDecimal::of($item['quantity'])->multipliedBy($item['rate'])->toScale($precision, RoundingMode::HALF_UP)->getUnscaledValue(), $data['items']);
        $subtotal  = BigInteger::sum(...$gross);
        $value     = BigDecimal::of($data['discount_value']);
        $discount  = match ($data['discount_mode']) {
            'percent' => BigDecimal::of($subtotal)->multipliedBy($value)->dividedBy(100, 0, RoundingMode::HALF_UP)->toBigInteger(),
            'fixed'   => $this->fixedDiscount($value, $precision),
            default   => BigInteger::zero(),
        };
        if ($discount->isGreaterThan($subtotal)) {
            throw ValidationException::withMessages(['discount_value' => 'The discount cannot exceed the subtotal.']);
        }
        $shares   = $this->allocate($discount, $subtotal, $gross, array_column($data['items'], 'key'));
        $groups   = [];
        $lines    = [];
        $totalTax = BigInteger::zero();
        foreach ($data['items'] as $index => $item) {
            $net        = $gross[$index]->minus($shares[$index]);
            $lineTax    = BigInteger::zero();
            $taxes      = [];
            $identities = [];
            foreach ($item['taxes'] as $tax) {
                $rate     = (string) BigDecimal::of($tax['percentage'])->toScale(4);
                $identity = strtolower(trim($tax['name'])).'|'.$rate;
                if (in_array($identity, $identities, true)) {
                    throw ValidationException::withMessages(["items.$index.taxes" => 'Do not apply the same named tax rate twice to a line.']);
                }
                $identities[] = $identity;
                $amount       = BigDecimal::of($net)->multipliedBy($rate)->dividedBy(100, 0, RoundingMode::HALF_UP)->toBigInteger();
                $lineTax      = $lineTax->plus($amount);
                $taxes[]      = [...$tax, 'percentage' => $rate, 'amount_minor' => $this->bounded($amount)];
                $groups[$identity] ??= ['name' => trim($tax['name']), 'percentage' => $rate, 'minor' => BigInteger::zero()];
                $groups[$identity]['minor'] = $groups[$identity]['minor']->plus($amount);
            }
            $totalTax = $totalTax->plus($lineTax);
            $lines[]  = [
                'key'       => $item['key'], 'gross_minor' => $this->bounded($gross[$index]), 'discount_minor' => $this->bounded($shares[$index]),
                'net_minor' => $this->bounded($net), 'tax_minor' => $this->bounded($lineTax), 'total_minor' => $this->bounded($net->plus($lineTax)), 'taxes' => $taxes,
            ];
        }
        $result = ['currency' => $data['currency'], 'precision' => $precision, 'subtotal_minor' => $this->bounded($subtotal), 'discount_minor' => $this->bounded($discount), 'tax_minor' => $this->bounded($totalTax), 'total_minor' => $this->bounded($subtotal->minus($discount)->plus($totalTax)), 'lines' => $lines];
        foreach (['subtotal', 'discount', 'tax', 'total'] as $field) {
            $result[$field] = self::money($result[$field.'_minor'], $precision);
        }
        foreach ($result['lines'] as &$line) {
            foreach (['gross', 'discount', 'net', 'tax', 'total'] as $field) {
                $line[$field] = self::money($line[$field.'_minor'], $precision);
            }
        }
        unset($line);
        $result['tax_groups'] = array_values(array_map(fn ($group) => ['name' => $group['name'], 'percentage' => $group['percentage'], 'amount' => self::money($this->bounded($group['minor']), $precision)], $groups));

        return $result;
    }

    private function fixedDiscount(BigDecimal $value, int $precision): BigInteger
    {
        try {
            return $value->toScale($precision, RoundingMode::UNNECESSARY)->getUnscaledValue();
        } catch (\Brick\Math\Exception\RoundingNecessaryException) {
            throw ValidationException::withMessages(['discount_value' => 'A fixed discount must use the selected currency’s monetary precision.']);
        }
    }

    private function bounded(BigInteger $amount): int
    {
        if ($amount->isGreaterThan(self::MAX_MINOR) || $amount->isNegative()) {
            throw ValidationException::withMessages(['items' => 'Invoice amounts exceed the supported limit. Reduce quantities or prices.']);
        }

        return $amount->toInt();
    }

    private function allocate(BigInteger $discount, BigInteger $subtotal, array $gross, array $keys): array
    {
        $shares = array_fill(0, count($gross), BigInteger::zero());
        if ($discount->isZero() || $subtotal->isZero()) {
            return $shares;
        }
        $remainders = [];
        foreach ($gross as $index => $amount) {
            [$shares[$index], $remainders[$index]] = $discount->multipliedBy($amount)->quotientAndRemainder($subtotal);
        }
        $remaining = $discount->minus(BigInteger::sum(...$shares))->toInt();
        $order     = array_keys($gross);
        usort($order, fn ($a, $b) => $remainders[$b]->compareTo($remainders[$a]) ?: strcmp($keys[$a], $keys[$b]));
        foreach (array_slice($order, 0, $remaining) as $index) {
            $shares[$index] = $shares[$index]->plus(1);
        }

        return $shares;
    }
}
