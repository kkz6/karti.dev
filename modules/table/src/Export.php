<?php

declare(strict_types=1);

namespace Modules\Table;

use BackedEnum;
use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Foundation\Bus\PendingDispatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Maatwebsite\Excel\Excel;
use Modules\Table\Traits\BelongsToTable;
use Modules\Table\Traits\GeneratesSignedTableUrls;
use Modules\Table\Traits\HandlesAuthorization;
use Modules\Table\Traits\HasDataAttributes;
use Modules\Table\Traits\HasMeta;
use RuntimeException;
use Symfony\Component\HttpFoundation\RedirectResponse;

class Export implements Arrayable
{
    use BelongsToTable;
    use GeneratesSignedTableUrls;
    use HandlesAuthorization;
    use HasDataAttributes;
    use HasMeta;

    /**
     * The index of the export.
     */
    protected int $index;

    /**
     * The default setting for limiting the export to the filtered rows.
     */
    protected static bool $defaultLimitToFilteredRows = false;

    /**
     * The default setting for limiting the export to the selected rows.
     */
    protected static bool $defaultLimitToSelectedRows = false;

    /**
     * The default queue name.
     */
    protected static ?string $defaultQueueName = null;

    /**
     * The default queue disk.
     */
    protected static ?string $defaultQueueDisk = null;

    /**
     * @param (Closure(Table, Export, Request, Builder): mixed)|null $using
     * @param Closure(PendingDispatch): mixed|null                   $withQueuedJob
     */
    public function __construct(
        public string $label,
        public string $filename,
        public string $type,
        public bool|Closure $authorize,
        public array $events = [],
        public ?array $dataAttributes = null,
        public ?array $meta = null,
        public ?bool $limitToFilteredRows = null,
        public ?bool $limitToSelectedRows = null,
        public ?Closure $using = null,
        public bool $asDownload = true,
        public bool $queue = false,
        public ?string $queueName = null,
        public ?string $queueDisk = null,
        public ?string $dialogTitle = '',
        public ?string $dialogMessage = '',
        public ?Closure $withQueuedJob = null,
        public ?Closure $redirect = null,
    ) {}

    /**
     * Get the label of the Export.
     */
    public function getLabel(): string
    {
        return $this->label;
    }

    /**
     * Get the filename of the Export.
     */
    public function getFilename(): string
    {
        return $this->filename;
    }

    /**
     * Get the type of the Export.
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * Get the events of the Export.
     */
    public function getEvents(): array
    {
        return $this->events;
    }

    /**
     * Get the index of the export.
     */
    public function getIndex(): int
    {
        return $this->index;
    }

    /**
     * Set the index of the export.
     */
    public function setIndex(int $index): self
    {
        $this->index = $index;

        return $this;
    }

    /**
     * Set the default setting for limiting the export to the filtered rows.
     */
    public static function defaultLimitToFilteredRows(bool $value = true): void
    {
        static::$defaultLimitToFilteredRows = $value;
    }

    /**
     * Limit the export to the filtered rows.
     */
    public function limitToFilteredRows(bool $value = true): self
    {
        $this->limitToFilteredRows = $value;

        return $this;
    }

    /**
     * Should the export be limited to the filtered rows.
     */
    public function shouldLimitToFilteredRows(): bool
    {
        return $this->limitToFilteredRows ?? static::$defaultLimitToFilteredRows;
    }

    /**
     * Set the default setting for limiting the export to the filtered rows.
     */
    public static function defaultLimitToSelectedRows(bool $value = true): void
    {
        static::$defaultLimitToSelectedRows = $value;
    }

    /**
     * Limit the export to the selected rows.
     */
    public function limitToSelectedRows(bool $value = true): self
    {
        $this->limitToSelectedRows = $value;

        return $this;
    }

    /**
     * Should the export be limited to the selected rows.
     */
    public function shouldLimitToSelectedRows(): bool
    {
        return $this->limitToSelectedRows ?? static::$defaultLimitToSelectedRows;
    }

    /**
     * Indicate that the export should be downloaded in the browser.
     */
    public function asDownload(bool $value = true): self
    {
        $this->asDownload = $value;

        return $this;
    }

    /**
     * Indicate that the export should not be downloaded but show a confirmation dialog.
     */
    public function redirectBackWithDialog(
        string $title = 'Export',
        string $message = 'Your export is being processed.'
    ): self {
        $this->dialogTitle   = $title;
        $this->dialogMessage = $message;

        return $this->asDownload(false);
    }

    /**
     * Set the default queue name.
     */
    public static function defaultQueueName(BackedEnum|string|null $value): void
    {
        static::$defaultQueueName = $value instanceof BackedEnum ? $value->value : $value;
    }

    /**
     * Get the queue name.
     */
    public function getQueueName(): ?string
    {
        return $this->queueName ?? static::$defaultQueueName;
    }

    /**
     * Get the default queue disk.
     */
    public static function defaultQueueDisk(BackedEnum|string|null $value): void
    {
        static::$defaultQueueDisk = $value instanceof BackedEnum ? $value->value : $value;
    }

    /**
     * Get the queue disk.
     */
    public function getQueueDisk(): ?string
    {
        return $this->queueDisk ?? static::$defaultQueueDisk;
    }

    /**
     * Indicate that the export should be queued.
     *
     * @param (callable(PendingDispatch): mixed)|(Closure(PendingDispatch): mixed)|null $withQueuedJob
     */
    public function queue(
        ?string $filename = null,
        BackedEnum|string|null $disk = null,
        BackedEnum|string|null $queue = null,
        string $title = 'Export',
        string $message = 'Your export is being processed.',
        callable|Closure|null $withQueuedJob = null,
    ): self {
        $this->filename = $filename ?? $this->filename;

        $this->queue         = true;
        $this->queueName     = $queue instanceof BackedEnum ? $queue->value : $queue;
        $this->queueDisk     = $disk instanceof BackedEnum ? $disk->value : $disk;
        $this->dialogTitle   = $title;
        $this->dialogMessage = $message;

        return $withQueuedJob ? $this->withQueuedJob($withQueuedJob) : $this;
    }

    /**
     * Interact with the queued job.
     */
    public function withQueuedJob(callable|Closure $withQueuedJob): self
    {
        $this->queue = true;

        $this->withQueuedJob = Helpers::asClosure($withQueuedJob);

        return $this;
    }

    /**
     * Dispatch the export job.
     */
    public function dispatchJob(): array
    {
        $pendingDispatch = dispatch($job = new ExportJob(
            $this->getTable(),
            $this->getIndex(),
        ));

        if (($callback = $this->withQueuedJob) instanceof Closure) {
            $callback($pendingDispatch);
        }

        if (! $this->hasUsingCallback() && ! empty($job->chained)) {
            $job->afterBuiltInExporter = $job->chained;
            $job->chained              = [];
        }

        return [$job, $pendingDispatch];
    }

    /**
     * Create a new Export instance.
     *
     * @param (callable(PendingDispatch): mixed)|(Closure(PendingDispatch): mixed)|null                                 $withQueuedJob
     * @param (callable(Table, Export, Request, Builder): mixed)|(Closure(Table, Export, Request, Builder): mixed)|null $using
     */
    public static function make(
        string $label = 'Excel Export',
        string $filename = 'export.xlsx',
        string $type = Excel::XLSX,
        bool|Closure $authorize = true,
        array $events = [],
        ?array $dataAttributes = null,
        ?array $meta = null,
        ?bool $limitToFilteredRows = null,
        ?bool $limitToSelectedRows = null,
        Closure|callable|null $using = null,
        bool $asDownload = true,
        string $dialogTitle = 'Exporting',
        string $dialogMessage = 'Your export is being processed.',
        callable|Closure|string|null $redirect = null,
        bool $queue = false,
        BackedEnum|string|null $queueName = null,
        BackedEnum|string|null $queueDisk = null,
        callable|Closure|null $withQueuedJob = null,
    ): static {
        $redirect = is_string($redirect)
            ? fn () => redirect()->to($redirect)
            : Helpers::asClosure($redirect);

        $using         = Helpers::asClosure($using);
        $withQueuedJob = Helpers::asClosure($withQueuedJob);

        return new static(
            label: $label,
            filename: $filename,
            type: $type,
            authorize: $authorize,
            events: $events,
            dataAttributes: $dataAttributes,
            meta: $meta,
            limitToFilteredRows: $limitToFilteredRows,
            limitToSelectedRows: $limitToSelectedRows,
            using: $using,
            asDownload: $asDownload,
            queue: $queue,
            queueName: $queueName instanceof BackedEnum ? $queueName->value : $queueName,
            queueDisk: $queueDisk instanceof BackedEnum ? $queueDisk->value : $queueDisk,
            dialogTitle: $dialogTitle,
            dialogMessage: $dialogMessage,
            withQueuedJob: $withQueuedJob,
            redirect: $redirect,
        );
    }

    /**
     * Set the closure that should be used to export the data.
     *
     * @param (callable(Table, Export, Request, Builder): mixed)|(Closure(Table, Export, Request, Builder): mixed) $using
     */
    public function using(Closure|callable $using): self
    {
        $this->using = Helpers::asClosure($using);

        return $this;
    }

    /**
     * Set a custom redirect path for custom and queued exports.
     */
    public function redirect(Closure|RedirectResponse|callable|string $redirect): self
    {
        if (is_string($redirect)) {
            $redirect = fn () => redirect()->to($redirect);
        } elseif ($redirect instanceof RedirectResponse) {
            $redirect = fn (): RedirectResponse => $redirect;
        }

        $this->redirect = Helpers::asClosure($redirect);

        return $this;
    }

    /**
     * Helper method to set a custom redirect route for custom and queued exports.
     */
    public function redirectToRoute(
        BackedEnum|string $route,
        mixed $parameters = [],
        int $status = 302,
        array $headers = []
    ): self {
        return $this->redirect(to_route($route, $parameters, $status, $headers));
    }

    /**
     * Determine if this export has a 'using' callback.
     */
    public function hasUsingCallback(): bool
    {
        return $this->using instanceof Closure;
    }

    /*
     * Execute the using callback for this export.
     */
    public function executeUsingCallback(): mixed
    {
        return ($this->using)(
            $this->table,
            $this,
            $this->table->getTableRequest()->getIlluminateRequest(),
            $this->makeExporter()->query()
        );
    }

    /**
     * Get the export URL.
     */
    public function getExportUrl(): string
    {
        $routeName = ! $this->queue && $this->asDownload
            ? 'inertia-tables.export'
            : 'inertia-tables.async-export';

        return $this->generateSignedTableUrl($this->table, $routeName, [
            'export' => $this->index,
            ...$this->shouldLimitToFilteredRows()
                ? $this->table->getTableRequest()->getQueryDataForExports()
                : [],
        ]);
    }

    /**
     * Get the array representation of the Export.
     */
    public function toArray(): array
    {
        if ($this->queue && ! $this->using instanceof Closure && blank($this->getQueueDisk())) {
            throw new RuntimeException('The export is queued, but no (default) disk is set.');
        }

        return [
            'label'               => $this->getLabel(),
            'authorized'          => $this->isAuthorized(),
            'dataAttributes'      => $this->buildDataAttributes(),
            'meta'                => $this->meta,
            'limitToSelectedRows' => $this->shouldLimitToSelectedRows(),
            'asDownload'          => $this->queue ? false : $this->asDownload,
            'url'                 => $this->getExportUrl(),
        ];
    }

    /**
     * Get the Exporter instance for the Export.
     */
    public function makeExporter(): Exporter
    {
        return new Exporter(
            $this->table,
            $this->getFilename(),
            $this->getType(),
            $this->getEvents(),
            $this->shouldLimitToFilteredRows(),
            $this->shouldLimitToSelectedRows()
        );
    }
}
