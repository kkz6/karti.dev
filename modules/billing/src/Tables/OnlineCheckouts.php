<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class OnlineCheckouts extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        abort_unless(auth()->user()->hasRole('super-admin') || auth()->user()->can('view payment reconciliation'), 403);

        return OnlineCheckout::query();
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('invoice_id', 'Invoice', toggleable: false)->mapAs(fn ($v) =>'Invoice #'.$v)->sortable()->url(fn (OnlineCheckout $c) =>Gate::allows('view', new Invoice) ? route('admin.invoices.show', $c->invoice_id) : null),
            Columns\TextColumn::make('expected_minor', 'Expected amount')->mapAs(fn ($v, OnlineCheckout $c) =>InvoiceCalculator::money((string) $v, $c->currency === 'JPY' ? 0 : 2))->sortable(),
            Columns\TextColumn::make('currency', 'Currency'),
            Columns\BadgeColumn::make('state', 'Status')->mapAs(fn ($v) =>ucfirst(str_replace('_', ' ', $v)))->variant(['paid'=>'success', 'needs_review'=>'warning', 'failed'=>'destructive', 'pending'=>'warning', 'creating'=>'info']),
            Columns\TextColumn::make('payment_id', 'Payment reference')->searchable(), Columns\TextColumn::make('session_id', 'Checkout reference')->searchable(),
            Columns\TextColumn::make('error', 'Review notes'), Columns\DateTimeColumn::make('created_at', 'Created')->sortable()];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('state', 'Status')->options(['creating'=>'Creating', 'pending'=>'Pending', 'paid'=>'Paid', 'needs_review'=>'Needs review', 'failed'=>'Failed']), Filters\DateFilter::make('created_at', 'Created')];
    }

    public function exports(): array
    {
        return [];
    }
}
