<?php

use Illuminate\Validation\ValidationException;
use Modules\Billing\Services\InvoiceCalculator;

function calculatorLine(string $rate = '1000', string $quantity = '1', array $taxes = [], string $key = '00000000-0000-4000-8000-000000000001'): array
{
    return ['key' => $key, 'rate' => $rate, 'quantity' => $quantity, 'taxes' => $taxes];
}

function calculateFixture(array $items, string $mode = 'none', string $value = '0', string $currency = 'INR'): array
{
    return (new InvoiceCalculator)->calculate(['currency' => $currency, 'discount_mode' => $mode, 'discount_value' => $value, 'items' => $items]);
}

test('invoice calculator matches the agreed discount and tax fixture', function () {
    $tax    = [['name' => 'Example tax', 'percentage' => '18']];
    $result = calculateFixture([calculatorLine('1000', '2', $tax), calculatorLine('500', '1', $tax, '00000000-0000-4000-8000-000000000002')], 'percent', '10');
    expect($result['subtotal'])->toBe('2500.00')->and($result['discount'])->toBe('250.00')->and($result['tax'])->toBe('405.00')->and($result['total'])->toBe('2655.00')->and($result['total_minor'])->toBe(265500)->and($result['tax_groups'])->toHaveCount(1);
});

test('fixed discount is distributed proportionally before mixed taxes', function () {
    $result = calculateFixture([calculatorLine('100', '1', [['name' => 'A', 'percentage' => '10']]), calculatorLine('300', '1', [['name' => 'B', 'percentage' => '20']], '00000000-0000-4000-8000-000000000002')], 'fixed', '100');
    expect($result['lines'][0]['discount'])->toBe('25.00')->and($result['lines'][1]['discount'])->toBe('75.00')->and($result['tax'])->toBe('52.50')->and($result['total'])->toBe('352.50');
});

test('discount residual uses stable line keys and survives reordering', function () {
    $one = calculatorLine('1', '1', [['name' => 'A', 'percentage' => '100']]);
    $two = calculatorLine('1', '1', [], '00000000-0000-4000-8000-000000000002');
    $a   = calculateFixture([$one, $two], 'fixed', '0.01');
    $b   = calculateFixture([$two, $one], 'fixed', '0.01');
    expect($a['lines'][0]['discount'])->toBe('0.01')->and($a['lines'][1]['discount'])->toBe('0.00')->and($a['total'])->toBe($b['total']);
});

test('fractional prices and quantities round each line half up', function () {
    expect(calculateFixture([calculatorLine('12.3456', '1.2345')])['total'])->toBe('15.24');
    expect(calculateFixture([calculatorLine('0.005'), calculatorLine('0.005', '1', [], '00000000-0000-4000-8000-000000000002')])['subtotal'])->toBe('0.02');
});

test('tax is rounded per line then grouped without compounding', function () {
    $taxes  = [['name' => 'A', 'percentage' => '10'], ['name' => 'B', 'percentage' => '10']];
    $result = calculateFixture([calculatorLine('0.05', '1', $taxes), calculatorLine('0.05', '1', $taxes, '00000000-0000-4000-8000-000000000002')]);
    expect($result['tax'])->toBe('0.04')->and($result['total'])->toBe('0.14')->and($result['tax_groups'][0]['amount'])->toBe('0.02');
});

test('zero prices and full discounts avoid division by zero', function () {
    expect(calculateFixture([calculatorLine('0')], 'fixed', '0')['total'])->toBe('0.00');
    expect(calculateFixture([calculatorLine('0')], 'percent', '100')['total'])->toBe('0.00');
    expect(calculateFixture([calculatorLine('10', '1', [['name' => 'Tax', 'percentage' => '18']])], 'percent', '100')['total'])->toBe('0.00');
});

test('currency precision controls amounts and fixed discounts', function () {
    expect(calculateFixture([calculatorLine('100.5')], 'none', '0', 'JPY')['total'])->toBe('101');
    expect(fn () => calculateFixture([calculatorLine('100')], 'fixed', '0.1', 'JPY'))->toThrow(ValidationException::class);
    expect(fn () => calculateFixture([calculatorLine('10')], 'fixed', '0.001'))->toThrow(ValidationException::class);
});

test('excessive discounts duplicate taxes unsupported currencies and overflow are rejected', function () {
    expect(fn () => calculateFixture([calculatorLine('10')], 'fixed', '11'))->toThrow(ValidationException::class);
    expect(fn () => calculateFixture([calculatorLine('0')], 'fixed', '0.01'))->toThrow(ValidationException::class);
    expect(fn () => calculateFixture([calculatorLine()], 'none', '0', 'ZZZ'))->toThrow(ValidationException::class);
    expect(fn () => calculateFixture([calculatorLine('1', '1', [['name' => 'Tax', 'percentage' => '10'], ['name' => ' tax ', 'percentage' => '10.0000']])]))->toThrow(ValidationException::class);
    expect(fn () => calculateFixture([calculatorLine('999999999.9999', '999999.9999', [['name' => 'Tax', 'percentage' => '100']])]))->toThrow(ValidationException::class);
});

test('large amounts preserve minor units beyond JavaScript safe integer range', function () {
    $result = calculateFixture([calculatorLine('999999999.9999', '100000')]);
    expect($result['total'])->toBe('99999999999990.00')->and($result['total_minor'])->toBe(9999999999999000);
});
