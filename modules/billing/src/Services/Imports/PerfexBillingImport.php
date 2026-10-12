<?php

namespace Modules\Billing\Services\Imports;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\ImportBatch;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceActivity;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Services\BillingImporter;
use RuntimeException;

class PerfexBillingImport
{
    private const MODELS = ['customer' => Customer::class, 'contact' => Contact::class, 'tax' => TaxRate::class, 'service' => Service::class, 'invoice' => Invoice::class, 'payment' => Payment::class, 'activity' => InvoiceActivity::class];

    public function plan(string $file, string $source): array
    {
        return app(PerfexImportPlan::class)->build(app(PerfexSqlReader::class)->read($file), $source);
    }

    public function review(array $plan): array
    {
        $report = ['errors' => [], 'warnings' => $plan['warnings'], 'counts' => [], 'mapping' => ['adapter' => 'perfex-sql-v1', 'timezone' => $plan['timezone'], 'duplicate_source_numbers' => json_encode($plan['duplicate_numbers'], JSON_THROW_ON_ERROR), 'next_invoice_number' => (string) $plan['next_number']],
            'totals'        => $plan['totals'], 'archive_counts' => $plan['inventory'], 'excluded_tables' => $plan['excluded_tables'], 'excluded_row_counts' => $plan['excluded_row_counts']];
        foreach ($plan['duplicate_numbers'] as $number => $ids) {
            $report['warnings'][] = 'Original number '.$number.' is retained on separate source invoices '.implode(', ', $ids).'.';
        }
        foreach ($plan['records'] as $kind => $records) {
            $report['counts'][$kind] = ['new' => 0, 'existing' => 0];
            foreach ($records as $id => $record) {
                $map = $this->mapping($plan['source'], $kind, $id);
                $report['counts'][$kind][$map ? 'existing' : 'new']++;
                if ($map && (! hash_equals($map->source_hash, $this->hash($record)) || ! self::MODELS[$kind]::find($map->destination_id))) {
                    $report['errors'][] = ['path' => $kind.':'.$id, 'message' => 'Mapped source changed or destination is missing. Existing records will not be overwritten.'];
                }
                if ($kind === 'invoice' && $map && Invoice::find($map->destination_id)?->items()->whereIn('key', array_column($record['items'], 'key'))->count() !== count($record['items'])) {
                    $report['errors'][] = ['path' => 'invoice:'.$id, 'message' => 'Mapped invoice line items are missing. Resolve destination integrity before replaying.'];
                }
                if ($kind === 'invoice' && ! $map && Invoice::where('formatted_number', $record['attributes']['formatted_number'])->exists()) {
                    $report['warnings'][] = 'Source invoice '.$id.' shares number '.$record['attributes']['formatted_number'].' with an existing invoice. They remain separate records linked by ID.';
                }
            }
        }
        // Supplementary records are part of the migration too; changed archives need review.
        $previous = ImportBatch::where('source', $plan['source'])->where('state', 'imported')->get();
        foreach ($previous as $batch) {
            if (array_sum(array_column($report['counts'], 'new')) > 0) {
                $report['errors'][] = ['path' => 'mapping', 'message' => 'An imported source has missing mappings or new records. Review an incremental migration explicitly.'];
                break;
            }
            $manifest = $batch->manifest;
            if (($manifest['format'] ?? null) !== 'perfex-sql-v1' || $this->hash($manifest['archive']) !== $this->hash($plan['archive'])) {
                $report['errors'][] = ['path' => 'archive', 'message' => 'This source has already been imported with different data. Use an explicitly reviewed incremental migration.'];
                break;
            }
        }

        return $report;
    }

    public function apply(array $plan, User $actor): ImportBatch
    {
        return DB::transaction(function () use ($plan, $actor) {
            // Serialize billing imports/issuance and recheck all collisions under the lock.
            $sequence = DB::table('billing_invoice_sequences')->where('scope', 'invoices')->lockForUpdate()->firstOrFail();
            $report   = $this->review($plan);
            if ($report['errors']) {
                throw new RuntimeException('Import blocked: '.implode(' ', array_column($report['errors'], 'message')));
            }
            $hash     = $this->hash($plan);
            $existing = ImportBatch::where('source', $plan['source'])->where('input_hash', $hash)->first();
            if ($existing?->state === 'imported') {
                return $existing;
            }
            // Bypass model events: importing history must not initiate live workflows.
            Model::withoutEvents(function () use ($plan) {
                foreach ($plan['records'] as $kind => $records) {
                    foreach ($records as $id => $record) {
                        if ($this->mapping($plan['source'], $kind, $id)) {
                            continue;
                        }
                        $attributes = $record['attributes'];
                        foreach ($record['links'] ?? [] as $column => [$relationKind, $relationId]) {
                            $attributes[$column] = $this->mapping($plan['source'], $relationKind, $relationId)?->destination_id
                                ?? throw new RuntimeException('Missing mapping for '.$relationKind.':'.$relationId);
                        }
                        if ($record['archive_on_import'] ?? false) {
                            $attributes['archived_at'] = now();
                        }
                        if ($kind === 'payment') {
                            $attributes['payment_method_id'] = \Modules\Billing\Support\PaymentMethods::resolve($attributes['method'], $attributes['method_label'], true)->id;
                        }
                        $model = new (self::MODELS[$kind]);
                        $model->forceFill($attributes)->save();
                        if ($kind === 'service') {
                            $model->taxRates()->sync(array_map(fn ($tax) => $this->mapping($plan['source'], 'tax', $tax)->destination_id, $record['taxes']));
                        }
                        if ($kind === 'invoice') {
                            foreach ($record['items'] as $position => $line) {
                                $totals = $record['calculated']['lines'][$position];
                                $item   = $model->items()->create([...Arr::except($line, ['taxes']), 'position' => $position,
                                    ...Arr::only($totals, ['gross_minor', 'discount_minor', 'net_minor', 'tax_minor', 'total_minor'])]);
                                foreach ($line['taxes'] as $index => $tax) {
                                    $item->taxes()->create([...$tax, 'amount_minor' => $totals['taxes'][$index]['amount_minor']]);
                                }
                            }
                        }
                        DB::table('billing_import_mappings')->insert(['source' => $plan['source'], 'kind' => $kind, 'external_id' => (string) $id, 'destination_id' => $model->id,
                            'source_hash'                                      => $this->hash($record), 'created_at' => now(), 'updated_at' => now()]);
                    }
                }
            });
            DB::table('billing_invoice_sequences')->where('scope', 'invoices')->update(['next_number' => max($sequence->next_number, $plan['next_number'])]);

            return ImportBatch::create(['source' => $plan['source'], 'input_hash' => $hash, 'manifest' => $plan, 'report' => $report, 'state' => 'imported', 'actor_id' => $actor->id, 'imported_at' => now()]);
        }, 3);
    }

    private function mapping(string $source, string $kind, int|string $id): ?object
    {
        return DB::table('billing_import_mappings')->where('source', $source)->where('kind', $kind)->where('external_id', (string) $id)->first();
    }

    private function hash(array $value): string
    {
        return app(BillingImporter::class)->hash($value);
    }
}
