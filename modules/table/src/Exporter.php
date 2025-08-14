<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Modules\Table\Columns\Column;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class Exporter implements FromQuery, Responsable, ShouldAutoSize, WithColumnFormatting, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use Exportable;

    protected array $styles = [];

    /**
     * @deprecated
     *
     * @var array<int, callable>
     */
    protected array $withQuery = [];

    protected ?array $scopePrimaryKey = null;

    public function __construct(
        protected Table $table,
        protected $fileName,
        protected $writerType,
        protected array $events,
        protected bool $limitToFilteredRows = false,
        protected bool $limitToSelectedRows = false,
    ) {}

    /**
     * Returns the file name for the export.
     */
    public function getFileName(): string
    {
        return $this->fileName;
    }

    /**
     * Returns the writer type for the export.
     */
    public function getWriterType(): string
    {
        return $this->writerType;
    }

    /**
     * @deprecated
     *
     * Adds a callback to the query builder.
     */
    public function withQuery(callable $callback): static
    {
        $this->withQuery[] = $callback;

        return $this;
    }

    /**
     * Limit the export to the given primary keys.
     */
    public function scopePrimaryKey(?array $keys): static
    {
        $this->scopePrimaryKey = $keys;

        return $this;
    }

    /**
     * Returns the Query Builder to fetch the records.
     */
    public function query(): Builder
    {
        $tableQueryBuilder = $this->table->queryBuilder();

        $query = $this->limitToFilteredRows
            ? $tableQueryBuilder->getResourceWithRequestApplied(applySort: false)
            : $tableQueryBuilder->getResource();

        if ($this->scopePrimaryKey !== null) {
            $this->table->scopePrimaryKey($query, $this->scopePrimaryKey);
        }

        if ($this->limitToSelectedRows) {
            $this->table->scopePrimaryKey($query, $this->table->getTableRequest()->selectedKeys());
        }

        foreach ($this->withQuery as $callback) {
            $callback($query);
        }

        return $query;
    }

    /**
     * Returns a collection with all columns used in the export.
     */
    protected function columns(): Collection
    {
        return collect($this->table->buildColumns())
            ->filter(static fn (Column $column): bool => $column->shouldBeExported())
            ->values();
    }

    /**
     * Returns an array of all column labels.
     */
    public function headings(): array
    {
        return $this->columns()->map(static fn (Column $column): string => $column->getHeader())->all();
    }

    /**
     * Returns an array with optional formatting for the columns.
     */
    public function columnFormats(): array
    {
        return $this->columns()->mapWithKeys(static function (Column $column, $key): array {
            $exportFormat = $column->getExportFormat();

            if ($exportFormat === null) {
                return [];
            }

            $format = is_callable($exportFormat) ? App::call($exportFormat) : $exportFormat;

            return [Coordinate::stringFromColumnIndex($key + 1) => $format];
        })->all();
    }

    /**
     * Returns an array with optional styling for each column. The column
     * may also be styled with a callback.
     */
    public function styles(Worksheet $sheet): array
    {
        $highest = $sheet->getHighestRowAndColumn();

        $highestRow    = $highest['row'];
        $highestColumn = $highest['column'];

        $sheet->setAutoFilter(sprintf('A1:%s1', $highestColumn));

        return $this->columns()->mapWithKeys(static function (Column $column, $key) use ($sheet, $highestRow): array {
            $exportStyling = $column->getExportStyle();

            if (! $exportStyling) {
                return [];
            }

            $sheetColumn = Coordinate::stringFromColumnIndex($key + 1);
            $coordinate  = sprintf('%s2:%s%s', $sheetColumn, $sheetColumn, $highestRow);

            if (is_array($exportStyling)) {
                return [$coordinate => $exportStyling];
            }

            call_user_func($exportStyling, $sheet->getStyle($coordinate));

            return [];
        })->all();
    }

    /**
     * Maps an item into cells for a row.
     */
    public function map(mixed $item): array
    {
        return $this->columns()->map(
            fn (Column $column): mixed => $column->mapForExport($column->getDataFromItem($item), $this->table, $item)
        )->all();
    }

    /**
     * An array with Events that should be registered.
     * https://docs.laravel-excel.com/3.1/exports/extending.html#events
     */
    public function registerEvents(): array
    {
        return $this->events;
    }

    /**
     * Returns the Table instance.
     */
    public function getTable(): Table
    {
        return $this->table;
    }
}
