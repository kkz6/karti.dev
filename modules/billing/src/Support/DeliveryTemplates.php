<?php

namespace Modules\Billing\Support;

use Carbon\CarbonImmutable;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Settings\BillingSettings;

class DeliveryTemplates
{
    public const FIELDS = ['customer_name', 'invoice_number', 'invoice_date', 'due_date', 'invoice_total', 'amount_due', 'currency', 'invoice_link', 'days_overdue', 'payment_amount', 'payment_date'];

    public const EVENTS = ['invoice', 'due', 'overdue', 'payment'];

    public static function defaults(): array
    {
        return [
            'invoice' => ['email_subject' => 'Invoice {invoice_number}', 'email_message' => 'Hello {customer_name}, your invoice total is {currency} {invoice_total}, due {due_date}.', 'sms_message' => 'Invoice {invoice_number}: {currency} {amount_due} due {due_date}. View: {invoice_link}'],
            'due'     => ['email_subject' => 'Payment reminder: {invoice_number}', 'email_message' => 'Your invoice {invoice_number} is due {due_date}. Amount due: {currency} {amount_due}.', 'sms_message' => 'Invoice {invoice_number} is due {due_date}. Balance: {currency} {amount_due}. {invoice_link}'],
            'overdue' => ['email_subject' => 'Overdue invoice: {invoice_number}', 'email_message' => 'Invoice {invoice_number} is {days_overdue} days overdue. Amount due: {currency} {amount_due}.', 'sms_message' => 'Invoice {invoice_number} is overdue by {days_overdue} days. Balance: {currency} {amount_due}. {invoice_link}'],
            'payment' => ['email_subject' => 'Payment received: {invoice_number}', 'email_message' => 'Thank you. We recorded {currency} {payment_amount} on {payment_date} for invoice {invoice_number}. Remaining balance: {currency} {amount_due}.', 'sms_message' => 'Payment received: {currency} {payment_amount} for {invoice_number}. Balance: {currency} {amount_due}. {invoice_link}'],
        ];
    }

    public static function variables(Invoice $invoice, ?Payment $payment = null, string $link = ''): array
    {
        $today = CarbonImmutable::now(app(BillingSettings::class)->timezone)->startOfDay();

        return [
            'customer_name'  => (string) ($invoice->customer_snapshot['display_name'] ?? $invoice->customer_name),
            'invoice_number' => (string) $invoice->formatted_number,
            'invoice_date'   => $invoice->invoice_date->format('Y-m-d'),
            'due_date'       => $invoice->due_date?->format('Y-m-d') ?? 'On receipt',
            'invoice_total'  => InvoiceCalculator::money((string) $invoice->total_minor, $invoice->currency_precision),
            'amount_due'     => app(InvoiceBalance::class)->data($invoice)['balance'],
            'currency'       => $invoice->currency,
            'invoice_link'   => $link,
            'days_overdue'   => (string) ($invoice->due_date ? max(0, (int) CarbonImmutable::parse($invoice->due_date->format('Y-m-d'), $today->timezone)->diffInDays($today)) : 0),
            'payment_amount' => $payment ? InvoiceCalculator::money((string) $payment->amount_minor, $payment->currency_precision) : '',
            'payment_date'   => $payment?->payment_date->format('Y-m-d') ?? '',
        ];
    }

    public static function render(string $template, array $variables): string
    {
        return strtr($template, array_combine(array_map(fn ($key) => '{'.$key.'}', array_keys($variables)), array_values($variables)));
    }

    public static function phone(string $phone): ?string
    {
        $phone = preg_replace('/[\s().-]+/', '', trim($phone));

        return preg_match('/^\+[1-9]\d{7,14}$/D', $phone) ? $phone : null;
    }
}
