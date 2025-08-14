<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

use BackedEnum;
use Closure;
use Modules\Table\Helpers;
use Modules\Table\Table;
use UnitEnum;

class BadgeColumn extends Column
{
    /**
     * The icon resolver.
     */
    public ?Closure $iconResolver = null;

    /**
     * The variant resolver.
     */
    public ?Closure $variantResolver = null;

    /**
     * {@inheritDoc}
     */
    public function mapForTable(mixed $value, Table $table, mixed $source = null): mixed
    {
        return [
            'icon'    => $this->resolveIcon($value, $source),
            'variant' => $variant = $this->resolveVariant($value, $source),
            'style'   => $variant, // Backward compatibility
            'value'   => parent::mapForTable($value, $table, $source),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function mapForExport(mixed $value, Table $table, mixed $source = null): mixed
    {
        return $this->exportAs
            ? call_user_func($this->exportAs, $value, $source, $table)
            : parent::mapForTable($value, $table, $source);
    }

    /**
     * Set a resolver to determine the icon for the badge.
     */
    public function icon(Closure|callable|array $iconResolver): static
    {
        $this->iconResolver = is_array($iconResolver)
            ? fn ($value) => $iconResolver[$value] ?? null
            : Helpers::asClosure($iconResolver);

        return $this;
    }

    /**
     * Resolve the icon for the badge.
     */
    protected function resolveIcon(mixed $value, mixed $source = null): ?string
    {
        return $this->iconResolver instanceof Closure
            ? call_user_func($this->iconResolver, $value, $source)
            : null;
    }

    /**
     * Alias for the "variant" method.
     *
     * @deprecated Use the "variant" method instead.
     */
    public function style(Closure|callable|array $style): static
    {
        return $this->variant($style);
    }

    /**
     * Set a resolver to determine the style for the badge.
     */
    public function variant(Closure|callable|array $variant): static
    {
        $this->variantResolver = is_array($variant)
            ? fn ($value) => $variant[$value] ?? null
            : Helpers::asClosure($variant);

        return $this;
    }

    /**
     * Resolve the style for the badge.
     */
    protected function resolveVariant(mixed $value, mixed $source = null): BackedEnum|UnitEnum|string|null
    {
        return $this->variantResolver instanceof Closure
            ? call_user_func($this->variantResolver, $value, $source)
            : null;
    }
}
