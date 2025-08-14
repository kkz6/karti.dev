<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Bus\PendingDispatch;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Maatwebsite\Excel\Jobs\QueueExport;
use ReflectionClass;

class ExportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Table $table,
        public int $index,
        public array $afterBuiltInExporter = [],
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $export = $this->table->getExportById($this->index);

        // Use a custom callback to handle the export...
        if ($export->hasUsingCallback()) {
            $export->executeUsingCallback();

            return;
        }

        // Use the built-in exporter from the Maatwebsite\Excel package...
        /** @var PendingDispatch $pendingDispatch */
        $pendingDispatch = $export->makeExporter()->queue(
            $export->filename,
            $export->getQueueDisk(),
            $export->getType()
        );

        if (! blank($this->connection)) {
            $pendingDispatch->onConnection($this->connection);
        }

        if (! blank($this->queue)) {
            $pendingDispatch->onQueue($this->queue);
        }

        if (! blank($this->chainConnection)) {
            $pendingDispatch->allOnConnection($this->chainConnection);
        }

        if (! blank($this->chainQueue)) {
            $pendingDispatch->allOnQueue($this->chainQueue);
        }

        if ($this->afterBuiltInExporter !== []) {
            /** @var QueueExport $job */
            $job          = $this->getJobFromPendingDispatch($pendingDispatch);
            $job->chained = [
                ...$job->chained,
                ...$this->afterBuiltInExporter,
            ];
        }
    }

    /**
     * Get the underlying job from the PendingDispatch instance.
     */
    protected function getJobFromPendingDispatch(PendingDispatch $pendingDispatch): mixed
    {
        if (method_exists($pendingDispatch, 'getJob')) {
            // See https://github.com/laravel/framework/pull/53951
            return $pendingDispatch->getJob();
        }

        $jobProperty = (new ReflectionClass($pendingDispatch))->getProperty('job');
        $jobProperty->setAccessible(true);

        return $jobProperty->getValue($pendingDispatch);
    }
}
