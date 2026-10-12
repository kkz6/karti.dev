<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Support\Currencies;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class Invoices extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', Invoice::class);

        return Invoice::query()->with(['customer', 'payments', 'creditAllocations.creditNote']);
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', toggleable: false)->sortable(),
            Columns\TextColumn::make('formatted_number', 'Invoice', toggleable: false)->mapAs(fn ($number, Invoice $invoice) => $number ?: 'Draft #'.$invoice->id)->url(fn (Invoice $invoice) => Gate::allows('view', $invoice) ? route('admin.invoices.index', ['invoice'=>$invoice->id]) : null)->searchable()->sortable(),
            Columns\TextColumn::make('customer_name', 'Customer')->searchable()->url(fn (Invoice $invoice) => $invoice->customer && Gate::allows('view', $invoice->customer) ? route('admin.customers.show', $invoice->customer_id) : null),
            Columns\DateColumn::make('invoice_date', 'Invoice date')->sortable(), Columns\DateColumn::make('due_date', 'Due date')->sortable(),
            Columns\DateColumn::make('created_at', 'Created')->hidden()->sortable()->sortUsing(fn (Builder $query, \Modules\Table\Enums\SortDirection $direction) => $query->orderBy('created_at', $direction->value)->orderBy('id', $direction->value)),
            Columns\TextColumn::make('currency', 'Currency'),
            Columns\TextColumn::make('total_minor', 'Total')->rightAligned()->cellClass('tabular-nums')->mapAs(fn ($minor, Invoice $invoice) => InvoiceCalculator::money((string) $minor, $invoice->currency_precision))->sortable(),
            Columns\TextColumn::make('balance', 'Balance')->rightAligned()->cellClass('tabular-nums')->mapAs(fn ($value, Invoice $invoice) => $invoice->status === 'issued' ? app(\Modules\Billing\Services\InvoiceBalance::class)->data($invoice)['balance'] : '—'),
            Columns\BadgeColumn::make('settlement', 'Settlement')->mapAs(fn ($value, Invoice $invoice) => ucfirst(app(\Modules\Billing\Services\InvoiceBalance::class)->data($invoice)['state']))->variant(function ($value, Invoice $invoice) {
                $state=app(\Modules\Billing\Services\InvoiceBalance::class)->data($invoice);

                return $invoice->status === 'cancelled' || $state['overdue'] ? 'destructive' : (in_array($state['state'], ['paid', 'settled']) ? 'success' : (in_array($state['state'], ['partial', 'unpaid']) ? 'warning' : 'muted'));
            }),
            Columns\BadgeColumn::make('status', 'Status')->mapAs(fn ($status) => ucfirst($status))->variant(['draft'=>'muted', 'issued'=>'info', 'cancelled'=>'destructive']), Columns\ActionColumn::new(asDropdown: true),
        ];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('status', 'Status')->options(['draft' => 'Draft', 'issued' => 'Issued', 'cancelled' => 'Cancelled']), Filters\SetFilter::make('currency', 'Currency')->options(Currencies::codes()), Filters\DateFilter::make('invoice_date', 'Invoice date')];
    }

    public function quickFilters(): array
    {
        return ['currency'];
    }

    public function quickFilterLabels(): array
    {
        return ['currency'=>'All currencies'];
    }

    public function tabs(): array
    {
        return [
            \Modules\Table\Tab::make('all', 'All')->filters(['status'=>null])->icon('layout-grid')->countUsing(fn (Builder $q) => $q->count()),
            \Modules\Table\Tab::make('draft', 'Drafts')->filters(['status'=>'draft'])->icon('file-pen-line')->countUsing(fn (Builder $q) => $q->where('status', 'draft')->count()),
            \Modules\Table\Tab::make('issued', 'Issued')->filters(['status'=>'issued'])->icon('circle-check')->tone('info')->countUsing(fn (Builder $q) => $q->where('status', 'issued')->count()),
            \Modules\Table\Tab::make('cancelled', 'Cancelled')->filters(['status'=>'cancelled'])->icon('circle-x')->tone('destructive')->countUsing(fn (Builder $q) => $q->where('status', 'cancelled')->count()),
        ];
    }

    public function actions(): array
    {
        Gate::authorize('viewAny', Invoice::class);

        return [
            Action::make('Preview', id: 'invoice-preview', authorize: fn () => Gate::allows('view', new Invoice), hidden: fn (Invoice $invoice) => Gate::denies('view', $invoice), icon: 'eye'),
            Action::make('Full details', id: 'invoice-details', authorize: fn () => Gate::allows('view', new Invoice), hidden: fn (Invoice $invoice) => Gate::denies('view', $invoice), icon: 'arrow-right'),
            Action::make('Download PDF', id: 'invoice-pdf', authorize: fn () => Gate::allows('download', new Invoice), hidden: fn (Invoice $invoice) => Gate::denies('download', $invoice), icon: 'download'),
            Action::make('Payment history', id: 'invoice-payments', authorize: fn () => Gate::allows('view', new \Modules\Billing\Models\Payment), hidden: fn (Invoice $invoice) => $invoice->status === 'draft' || Gate::denies('view', $invoice), icon: 'credit-card'),
            Action::make('Email & sharing', id: 'invoice-sharing', authorize: fn () => Gate::allows('view', new Invoice), hidden: fn (Invoice $invoice) => $invoice->status !== 'issued' || (Gate::denies('send', $invoice) && Gate::denies('share', $invoice)), icon: 'mail'),
            Action::make('Edit draft', id: 'invoice-edit', authorize: fn () => Gate::allows('update', new Invoice), hidden: fn (Invoice $invoice) => $invoice->status !== 'draft' || Gate::denies('update', $invoice), icon: 'pencil'),
        ];
    }

    public function exports(): array
    {
        Gate::authorize('viewAny', Invoice::class);

        return [];
    }
}
