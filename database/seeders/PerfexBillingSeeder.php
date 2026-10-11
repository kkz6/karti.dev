<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

/** Explicit opt-in only. Keep SQL and real customer data outside the repository. */
class PerfexBillingSeeder extends Seeder
{
    public function run(): void
    {
        $file  = getenv('PERFEX_SQL_PATH');
        $actor = getenv('PERFEX_IMPORT_ACTOR');
        if (! $file || ! $actor) {
            throw new RuntimeException('Set PERFEX_SQL_PATH and PERFEX_IMPORT_ACTOR. Run billing:import-perfex without --apply to review first.');
        }
        $exit = $this->command->call('billing:import-perfex', ['file' => $file, '--source' => getenv('PERFEX_IMPORT_SOURCE') ?: 'perfex', '--actor' => $actor, '--apply' => true]);
        if ($exit !== 0) {
            throw new RuntimeException('Perfex migration did not complete. Review the validation errors above.');
        }
    }
}
