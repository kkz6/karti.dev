<?php

namespace Modules\Billing\Services;

use Brick\Math\BigInteger;
use Illuminate\Support\Arr;
use Modules\Billing\Models\Invoice;

class InvoicePresentation
{
    public function brandedData(Invoice $invoice): array
    {
        $data = $this->data($invoice);
        try {
            $data['logo'] = app(InvoicePdf::class)->logo($invoice);
        } catch (\Throwable $exception) {
            report($exception);
            $data['logo'] = null;
        }

        return $data;
    }

    public function data(Invoice $invoice): array
    {
        $invoice->load('items.taxes');
        $data                    = $invoice->only(['id', 'status', 'formatted_number', 'version', 'customer_id', 'currency', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions', 'customer_snapshot', 'seller_snapshot', 'cancellation_reason']);
        $data['seller_snapshot'] = Arr::except($data['seller_snapshot'], ['logo_file']);
        $data['invoice_date']    = $invoice->invoice_date->format('Y-m-d');
        $data['due_date']        = $invoice->due_date?->format('Y-m-d');
        $data['issued_at']       = $invoice->issued_at?->toIso8601String();
        $data['cancelled_at']    = $invoice->cancelled_at?->toIso8601String();
        $precision               = $invoice->currency_precision;
        $totals                  = ['currency' => $invoice->currency, 'precision' => $precision];
        foreach (['subtotal', 'discount', 'tax', 'total'] as $field) {
            $totals[$field] = InvoiceCalculator::money($invoice->{$field.'_minor'}, $precision);
        }
        $groups        = [];
        $lines         = [];
        $data['items'] = $invoice->items->map(function ($item) use (&$groups, &$lines, $precision) {
            $line                           = $item->only(['key', 'service_id', 'description', 'additional_description', 'unit', 'quantity', 'rate']);
            $line['additional_description'] = InvoiceText::description($line['additional_description']);
            $line['taxes']                  = $item->taxes->map(function ($tax) use (&$groups, $precision) {
                $key = strtolower(trim($tax->name)).'|'.$tax->percentage;
                $groups[$key] ??= ['name' => $tax->name, 'percentage' => $tax->percentage, 'minor' => BigInteger::zero()];
                $groups[$key]['minor'] = $groups[$key]['minor']->plus($tax->amount_minor);

                return [...$tax->only(['tax_rate_id', 'name', 'percentage']), 'amount' => InvoiceCalculator::money($tax->amount_minor, $precision)];
            })->all();
            $row = ['key' => $item->key];
            foreach (['gross', 'discount', 'net', 'tax', 'total'] as $field) {
                $row[$field] = InvoiceCalculator::money((string) $item->{$field.'_minor'}, $precision);
            }
            $lines[] = $row;

            return [...$line, ...Arr::except($row, ['key'])];
        })->all();
        $totals['lines']      = $lines;
        $totals['tax_groups'] = array_values(array_map(fn ($group) => ['name' => $group['name'], 'percentage' => $group['percentage'], 'amount' => InvoiceCalculator::money((string) $group['minor'], $precision)], $groups));
        $data['totals']       = $totals;

        return $data;
    }
}
