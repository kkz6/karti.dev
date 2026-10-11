<?php

namespace Modules\Billing\Console\Commands;

use Illuminate\Console\Command;
use Modules\Auth\Models\User;
use Modules\Billing\Services\Imports\PerfexBillingImport;
use Throwable;

class ImportPerfexBilling extends Command
{
    protected $signature = 'billing:import-perfex {file : Absolute path to the private SQL export} {--source=perfex : Stable identity of the source system} {--apply : Import after validation; default is read-only} {--actor= : Local administrator user ID, required with --apply} {--report= : Save an aggregate JSON report to a new private file}';

    protected $description = 'Validate or import Perfex billing history without executing SQL or triggering billing workflows';

    public function handle(PerfexBillingImport $importer): int
    {
        try {
            $plan   = $importer->plan($this->argument('file'), $this->option('source'));
            $report = $importer->review($plan);
            $this->table(['Record type', 'New', 'Already imported'], collect($report['counts'])->map(fn ($count, $kind) => [$kind, $count['new'], $count['existing']])->all());
            foreach ($report['totals'] as $currency => $totals) {
                $this->line($currency.': '.json_encode($totals));
            }
            foreach ($report['warnings'] as $warning) {
                $this->warn($warning);
            }
            foreach ($report['errors'] as $error) {
                $this->error($error['path'].': '.$error['message']);
            }
            if ($this->option('report')) {
                $oldMask = umask(0077);
                try {
                    $file = @fopen($this->option('report'), 'x');
                    if (! $file) {
                        throw new \RuntimeException('Report path must be a new writable file. Existing files are never replaced.');
                    }
                    try {
                        $json = json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)."\n";
                        if (fwrite($file, $json) !== strlen($json)) {
                            throw new \RuntimeException('Could not write the complete report.');
                        }
                    } finally {
                        fclose($file);
                    }
                } finally {
                    umask($oldMask);
                }
            }
            if ($report['errors']) {
                return self::FAILURE;
            }
            if (! $this->option('apply')) {
                $this->info('Validation passed. No database records were changed.');

                return self::SUCCESS;
            }
            $actor = User::find($this->option('actor'));
            if (! $actor || ! $actor->can('import billing data')) {
                $this->error('Choose a local user with import billing data permission using --actor.');

                return self::FAILURE;
            }
            $batch = $importer->apply($plan, $actor);
            $this->info('Import complete. Batch '.$batch->id.'. Source archive is available from the billing import review page.');

            return self::SUCCESS;
        } catch (Throwable $error) {
            // Do not print SQL exception values, which may contain private source records.
            $this->error($error instanceof \Illuminate\Database\QueryException ? 'Database rejected the import. The transaction was rolled back; inspect schema compatibility.' : $error->getMessage());

            return self::FAILURE;
        }
    }
}
