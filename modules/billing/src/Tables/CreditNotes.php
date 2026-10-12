<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\CreditBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Support\Currencies;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class CreditNotes extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', CreditNote::class);
        Gate::authorize('view', new Invoice);

        return CreditNote::query()->with(['allocations', 'refunds', 'customer']);
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('formatted_number', 'Credit note', toggleable: false)->mapAs(fn ($v, CreditNote $c) =>$v ?: 'Draft #'.$c->id)->searchable()->sortable()->url(fn (CreditNote $c) =>Gate::allows('view', $c) ? route('admin.credit-notes.show', $c) : null),
            Columns\TextColumn::make('customer', 'Customer')->mapAs(fn ($v, CreditNote $c) =>($c->customer_snapshot['legal_name'] ?? '') ?: ($c->customer_snapshot['display_name'] ?? '—'))->url(fn (CreditNote $c) => $c->customer && Gate::allows('view', $c->customer) ? route('admin.customers.show', $c->customer_id) : null),
            Columns\DateColumn::make('credit_date', 'Date')->sortable(),
            Columns\TextColumn::make('total_minor', 'Total')->rightAligned()->cellClass('tabular-nums')->mapAs(fn ($v, CreditNote $c) =>InvoiceCalculator::money((string) $v, $c->currency_precision))->sortable(),
            Columns\TextColumn::make('available', 'Available')->rightAligned()->cellClass('tabular-nums')->mapAs(fn ($v, CreditNote $c) =>app(CreditBalance::class)->data($c)['available']),
            Columns\TextColumn::make('currency', 'Currency'),
            Columns\BadgeColumn::make('status', 'Status')->mapAs(fn ($v) =>ucfirst($v))->variant(['issued'=>'info', 'draft'=>'secondary', 'cancelled'=>'destructive']),
            Columns\ActionColumn::new()];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('status', 'Status')->options(['draft'=>'Draft', 'issued'=>'Issued', 'cancelled'=>'Cancelled']), Filters\SetFilter::make('currency', 'Currency')->options(Currencies::codes()), Filters\DateFilter::make('credit_date', 'Date')];
    }

    public function actions(): array
    {
        return [Action::make('Open', url: fn (CreditNote $c) =>route('admin.credit-notes.show', $c), authorize: fn () => Gate::allows('view', new CreditNote), icon: 'external-link')];
    }

    public function exports(): array
    {
        return [];
    }
}
