<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

use BackedEnum;
use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Macroable;
use Illuminate\Support\Traits\Tappable;
use Modules\Table\HasMeta;
use Modules\Table\Helpers;
use Modules\Table\Html;
use Modules\Table\Image;
use Modules\Table\SortDirection;
use Modules\Table\SortUsingPriority;
use Modules\Table\Table;
use Modules\Table\Url;
use Kirschbaum\PowerJoins\EloquentJoins;
use RuntimeException;
use UnitEnum;

abstract class Column implements Arrayable
{
    use Conditionable;
    use HasMeta;
    use Macroable;
    use Tappable;

    /**
     * Indicates whether the column is stickable by default.
     */
    protected static ?bool $defaultStickable = null;

    public function __construct(
        protected string $attribute,
        protected string $header,
        protected bool $sortable,
        protected bool $toggleable,
        protected bool $searchable,
        protected ColumnAlignment $alignment,
        protected Closure|array|null $mapAs = null,
        protected Closure|bool|null $exportAs = null,
        protected Closure|string|null $exportFormat = null,
        protected Closure|array|null $exportStyle = null,
        protected bool $visible = true,
        protected ?Closure $sortUsing = null,
        protected ?array $meta = null,
        protected ?Closure $url = null,
        protected bool $wrap = false,
        protected ?int $truncate = null,
        protected ?string $headerClass = null,
        protected ?string $cellClass = null,
        protected ?Closure $image = null,
        protected ?bool $stickable = null,
    ) {
        $this->wrap = $wrap || (bool) $truncate;
    }

    /**
     * Create a new Column instance.
     */
    public static function make(
        string $attribute,
        ?string $header = null,
        bool $sortable = false,
        bool $toggleable = true,
        bool $searchable = false,
        ColumnAlignment $alignment = ColumnAlignment::Left,
        Closure|callable|array|null $mapAs = null,
        Closure|bool|null $exportAs = null,
        Closure|string|null $exportFormat = null,
        Closure|array|null $exportStyle = null,
        bool $visible = true,
        Closure|callable|null $sortUsing = null,
        ?array $meta = null,
        Closure|callable|null $url = null,
        bool $wrap = false,
        ?int $truncate = null,
        array|string|null $headerClass = null,
        array|string|null $cellClass = null,
        Closure|callable|null $image = null,
        ?bool $stickable = null,
    ): static {
        return new static(
            attribute: $attribute,
            header: $header ?? Str::headline($attribute),
            sortable: $sortable,
            toggleable: $toggleable,
            searchable: $searchable,
            alignment: $alignment,
            mapAs: is_array($mapAs) ? $mapAs : Helpers::asClosure($mapAs),
            exportAs: $exportAs,
            exportFormat: $exportFormat,
            exportStyle: $exportStyle,
            visible: $visible,
            sortUsing: Helpers::asClosure($sortUsing),
            meta: $meta,
            url: Helpers::asClosure($url),
            wrap: $wrap,
            truncate: $truncate,
            headerClass: Html::formatCssClass($headerClass),
            cellClass: Html::formatCssClass($cellClass),
            image: Helpers::asClosure($image),
            stickable: $stickable,
        );
    }

    /**
     * Make columns stickable by default.
     */
    public static function defaultStickable(bool $defaultStickable = true): void
    {
        static::$defaultStickable = $defaultStickable;
    }

    /**
     * Set the attribute of the column.
     */
    public function attribute(string $attribute): self
    {
        $this->attribute = $attribute;

        return $this;
    }

    /**
     * Set the header of the column.
     */
    public function header(string $header): self
    {
        $this->header = $header;

        return $this;
    }

    /**
     * Set the column as sortable.
     */
    public function sortable(bool $sortable = true): self
    {
        $this->sortable = $sortable;

        return $this;
    }

    /**
     * Set the column as not sortable.
     */
    public function notSortable(): self
    {
        return $this->sortable(false);
    }

    /**
     * Set the column as toggleable.
     */
    public function toggleable(bool $toggleable = true): self
    {
        $this->toggleable = $toggleable;

        return $this;
    }

    /**
     * Set the column as not toggleable.
     */
    public function notToggleable(): self
    {
        return $this->toggleable(false);
    }

    /**
     * Set the column as searchable.
     */
    public function searchable(bool $searchable = true): self
    {
        $this->searchable = $searchable;

        return $this;
    }

    /**
     * Set the column as not searchable.
     */
    public function notSearchable(): self
    {
        return $this->searchable(false);
    }

    /**
     * Set the column as visible.
     */
    public function visible(bool $visible = true): self
    {
        $this->visible = $visible;

        return $this;
    }

    /**
     * Set the column as not visible.
     */
    public function hidden(bool $hidden = true): self
    {
        return $this->visible(! $hidden);
    }

    /**
     * Set a custom mapping for the column.
     */
    public function mapAs(Closure|callable|array $mapAs): self
    {
        $this->mapAs = is_array($mapAs)
            ? $mapAs
            : Helpers::asClosure($mapAs);

        return $this;
    }

    /**
     * Do not export the column.
     */
    public function dontExport(): self
    {
        $this->exportAs = false;

        return $this;
    }

    /**
     * Set a custom mapping for the column when exporting.
     */
    public function exportAs(Closure|bool $exportAs): self
    {
        $this->exportAs = $exportAs;

        return $this;
    }

    /**
     * Set a custom format for the column when exporting.
     */
    public function exportFormat(Closure|string $exportFormat): self
    {
        $this->exportFormat = $exportFormat;

        return $this;
    }

    /**
     * Set a custom style for the column when exporting.
     */
    public function exportStyle(Closure|array $exportStyle): self
    {
        $this->exportStyle = $exportStyle;

        return $this;
    }

    /**
     * Set the alignment of the column.
     */
    public function align(ColumnAlignment $alignment): self
    {
        $this->alignment = $alignment;

        return $this;
    }

    /**
     * Set the alignment of the column to left.
     */
    public function leftAligned(): self
    {
        return $this->align(ColumnAlignment::Left);
    }

    /**
     * Set the alignment of the column to center.
     */
    public function centerAligned(): self
    {
        return $this->align(ColumnAlignment::Center);
    }

    /**
     * Set the alignment of the column to right.
     */
    public function rightAligned(): self
    {
        return $this->align(ColumnAlignment::Right);
    }

    /**
     * Set the custom sorting logic for the column.
     */
    public function sortUsing(Closure|callable $sortUsing): self
    {
        $this->sortUsing = Helpers::asClosure($sortUsing);

        return $this;
    }

    /**
     * Set the sorting logic for the column using a priority array.
     */
    public function sortUsingPriority(array $priority): self
    {
        return $this->sortUsing(
            new SortUsingPriority($this->getAttribute(), $priority)
        );
    }

    /**
     * Call the sortUsingPriority method using the given map or the map set using the mapAs method.
     */
    public function sortUsingMap(?array $map = null): self
    {
        if (is_null($map) && ! is_array($this->mapAs)) {
            throw new RuntimeException('Provide a map to this method or set a map using the mapAs method.');
        }

        $map ??= $this->mapAs;

        return $this->sortUsingPriority(
            collect($map)->sort()->keys()->all()
        );
    }

    /**
     * Set the URL resolver for the column.
     */
    public function url(Closure|callable $url): self
    {
        $this->url = Helpers::asClosure($url);

        return $this;
    }

    /**
     * Set the Image resolver for the column.
     */
    public function image(Closure|callable|string $image, Closure|callable|null $additionalCallback = null): self
    {
        $image = is_string($image)
            ? fn (mixed $item, Image $instance): Image => $instance->url(data_get($item, $image))
            : Helpers::asClosure($image);

        $additionalCallback = Helpers::asClosure($additionalCallback);

        $this->image = function (mixed $item, Image $instance) use ($image, $additionalCallback): void {
            $image($item, $instance);

            if ($additionalCallback instanceof Closure) {
                $additionalCallback($instance, $item);
            }
        };

        return $this;
    }

    /**
     * Assert that the PowerJoins package is installed.
     */
    protected function assertPowerJoinsIsInstalled(): bool
    {
        return class_exists(EloquentJoins::class) || throw new RuntimeException(
            "To order the query using a column from a relationship, please install the 'kirschbaum-development/eloquent-power-joins' package."
        );
    }

    /**
     * Apply the sorting to the given query.
     */
    public function applySort(Builder $query, SortDirection $direction): void
    {
        if ($this->sortUsing instanceof Closure) {
            call_user_func($this->sortUsing, $query, $direction);

            return;
        }

        $this->isNested()
            ? $this->assertPowerJoinsIsInstalled() && $query->orderByPowerJoins($this->getAttribute(), $direction->value)
            : $query->orderBy($this->getAttribute(), $direction->value);
    }

    /**
     * Returns a boolean whether to columns refers to a relationship.
     */
    public function isNested(): bool
    {
        return Str::contains($this->attribute, '.') && ! Str::startsWith($this->attribute, 'pivot.');
    }

    /**
     * Returns the name of the relationship.
     */
    public function relationshipName(): string
    {
        return Str::beforeLast($this->attribute, '.');
    }

    /**
     * Returns the target column on the relationship.
     */
    public function relationshipColumn(): string
    {
        return Str::afterLast($this->attribute, '.');
    }

    /**
     * Get the attribute of the column.
     */
    public function getAttribute(): string
    {
        return $this->attribute;
    }

    /**
     * Get the header of the column.
     */
    public function getHeader(): string
    {
        return $this->header;
    }

    /**
     * Get the export format for the column.
     */
    public function getExportFormat(): Closure|string|null
    {
        return $this->exportFormat;
    }

    /**
     * Get the export style for the column.
     */
    public function getExportStyle(): Closure|array|null
    {
        return $this->exportStyle;
    }

    /**
     * Returns a boolean whether the column is sortable.
     */
    public function isSortable(): bool
    {
        return $this->sortable;
    }

    /**
     * Returns a boolean whether the column is searchable.
     */
    public function isSearchable(): bool
    {
        return $this->searchable;
    }

    /**
     * Returns a boolean whether the column is toggleable.
     */
    public function isToggleable(): bool
    {
        return $this->toggleable;
    }

    /**
     * Returns a boolean whether the column is visible.
     */
    public function isVisible(): bool
    {
        return ! $this->toggleable || $this->visible;
    }

    /**
     * Returns a boolean whether the column is stickable.
     */
    public function isStickable(): bool
    {
        return $this->stickable ?? static::$defaultStickable ?? false;
    }

    /**
     * Returns a boolean whether the column should be exported.
     */
    public function shouldBeExported(): bool
    {
        return $this->exportAs !== false;
    }

    /**
     * Map the value for this column based on the given table.
     */
    protected function mapValue(mixed $value, Table $table, mixed $source = null): mixed
    {
        return $value;
    }

    /**
     * Map the value to be displayed in the table.
     */
    public function mapForTable(mixed $value, Table $table, mixed $source = null): mixed
    {
        if (is_array($this->mapAs)) {
            $key = match (true) {
                $value instanceof BackedEnum => $value->value,
                $value instanceof UnitEnum => $value->name,
                default => $value,
            };

            return $key === null ? null : Arr::get($this->mapAs, $key);
        }

        return $this->mapAs instanceof Closure
            ? call_user_func($this->mapAs, $value, $source)
            : $this->mapValue($value, $table, $source);
    }

    /**
     * Map the value to be displayed in the export.
     */
    public function mapForExport(mixed $value, Table $table, mixed $source = null): mixed
    {
        return $this->exportAs
            ? call_user_func($this->exportAs, $value, $source, $table)
            : $this->mapForTable($value, $table, $source);
    }

    /**
     * It gets the data from the given item, based on the column
     * and whether that column is based on a relationship
     * Supports returning multiple items as well.
     */
    public function getDataFromItem(mixed $item): mixed
    {
        if ($this->isNested()) {
            $results = data_get($item, $this->relationshipName());

            if ($results instanceof Collection) {
                $key = $this->relationshipColumn();

                return $results->map->{$key}->all();
            }
        }

        return data_get($item, $this->attribute);
    }

    /**
     * Returns a boolean whether the column has a URL resolver.
     */
    public function hasUrl(): bool
    {
        return ! is_null($this->url);
    }

    /**
     * Resolve the URL for the given model.
     */
    public function resolveUrl(Model $model): string|array|null
    {
        return Url::resolve($model, $this->url);
    }

    /**
     * Returns a boolean whether the column has an Image resolver.
     */
    public function hasImage(): bool
    {
        return ! is_null($this->image);
    }

    /**
     * Resolve the Image for the given model.
     */
    public function resolveImage(Model $model): string|array|null
    {
        return Image::resolve($model, $this->image);
    }

    /**
     * Returns a boolean whether the given column is the same as the current one.
     */
    public function is(?Column $column = null): bool
    {
        return $column instanceof Column && $this->toArray() === $column->toArray();
    }

    /**
     * Set the column to wrap its content.
     */
    public function wrap(bool $wrap = true): self
    {
        $this->wrap = $wrap;

        return $this;
    }

    /**
     * Set the line clamp for the column.
     */
    public function truncate(?int $value = 1): self
    {
        $this->truncate = $value;

        return $this->wrap();
    }

    /**
     * Set the header class for the column.
     */
    public function headerClass(array|string|null $class = null): self
    {
        $this->headerClass = Html::formatCssClass($class);

        return $this;
    }

    /**
     * Set the cell class for the column.
     */
    public function cellClass(array|string|null $class = null): self
    {
        $this->cellClass = Html::formatCssClass($class);

        return $this;
    }

    /**
     * Indicates that the column can be sticky.
     */
    public function stickable(bool $stickable = true): self
    {
        $this->stickable = $stickable;

        return $this;
    }

    /**
     * Indicates that the column cannot be sticky.
     */
    public function notStickable(): self
    {
        return $this->stickable(false);
    }

    /**
     * Return an array representation of the column.
     */
    public function toArray(): array
    {
        return [
            'type' => Str::of(class_basename(static::class))
                ->beforeLast('Column')
                ->snake()
                ->replace('_', '-')
                ->value(),
            'header' => $this->getHeader(),
            'attribute' => $this->getAttribute(),
            'sortable' => $this->isSortable(),
            'toggleable' => $this->isToggleable(),
            'alignment' => $this->alignment->value,
            'visibleByDefault' => $this->isVisible(),
            'meta' => $this->meta,
            'wrap' => $this->wrap,
            'truncate' => $this->truncate,
            'headerClass' => $this->headerClass,
            'cellClass' => $this->cellClass,
            'stickable' => $this->isStickable(),
        ];
    }
}
