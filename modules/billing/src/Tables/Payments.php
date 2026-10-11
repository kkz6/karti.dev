<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Support\Currencies;
use Modules\Billing\Support\PaymentMethods;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class Payments extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', Payment::class);
        Gate::authorize('view', new Payment);

        return Payment::query()->with('invoice');
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'Payment')->mapAs(fn ($id) => '#'.$id)->sortable(),
            Columns\TextColumn::make('invoice.formatted_number', 'Invoice')->searchable()->url(fn (Payment $payment) => Gate::allows('view', $payment->invoice) ? route('admin.invoices.show', $payment->invoice_id) : null),
            Columns\TextColumn::make('invoice.customer_name', 'Customer')->searchable(),
            Columns\DateColumn::make('payment_date', 'Payment date')->sortable(),
            Columns\TextColumn::make('amount_minor', 'Amount')->mapAs(fn ($minor, Payment $payment) => InvoiceCalculator::money((string) $minor, $payment->currency_precision))->sortable(),
            Columns\TextColumn::make('currency', 'Currency'),
            Columns\TextColumn::make('method_label', 'Method'),
            Columns\TextColumn::make('reference', 'Reference')->searchable(),
            Columns\BadgeColumn::make('reversed_at', 'Status')->mapAs(fn ($at) => $at ? 'Reversed' : 'Active')->variant(fn ($at) => $at ? 'warning' : 'success'),
        ];
    }

    public function filters(): array
    {
        return [Filters\DateFilter::make('payment_date', 'Payment date'), Filters\SetFilter::make('currency', 'Currency')->options(Currencies::codes()), Filters\SetFilter::make('method', 'Method')->options(PaymentMethods::LABELS)];
    }

    public function exports(): array
    {
        Gate::authorize('viewAny', Payment::class);
        Gate::authorize('view', new Payment);

        return [];
    }
}
