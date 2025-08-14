<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

use Modules\Table\Table;

class BooleanColumn extends Column
{
    /**
     * A default label for the "true" value.
     */
    protected static ?string $defaultTrueLabel = null;

    /**
     * A default label for the "false" value.
     */
    protected static ?string $defaultFalseLabel = null;

    /**
     * The label for the "true" value.
     */
    protected ?string $trueLabel = null;

    /**
     * The label for the "false" value.
     */
    protected ?string $falseLabel = null;

    /**
     * A default icon for the "true" value.
     */
    protected static ?string $defaultTrueIcon = null;

    /**
     * A default icon for the "false" value.
     */
    protected static ?string $defaultFalseIcon = null;

    /**
     * The icon for the "true" value.
     */
    protected ?string $trueIcon = null;

    /**
     * The icon for the "false" value.
     */
    protected ?string $falseIcon = null;

    /**
     * Set the default label for the "true" value.
     */
    public static function setDefaultTrueLabel(?string $label = null): void
    {
        static::$defaultTrueLabel = $label;
    }

    /**
     * Set the default label for the "false" value.
     */
    public static function setDefaultFalseLabel(?string $label = null): void
    {
        static::$defaultFalseLabel = $label;
    }

    /**
     * Set the label for the "true" value.
     */
    public function trueLabel(string $label): static
    {
        $this->trueLabel = $label;

        return $this;
    }

    /**
     * Set the label for the "false" value.
     */
    public function falseLabel(string $label): static
    {
        $this->falseLabel = $label;

        return $this;
    }

    /**
     * Get the label for the "true" value.
     */
    protected function getTrueLabel(): string
    {
        return $this->trueLabel ?? static::$defaultTrueLabel ?? 'Yes';
    }

    /**
     * Get the label for the "false" value.
     */
    protected function getFalseLabel(): string
    {
        return $this->falseLabel ?? static::$defaultFalseLabel ?? 'No';
    }

    /**
     * Set the default icon for the "true" value.
     */
    public static function setDefaultTrueIcon(?string $icon = null): void
    {
        static::$defaultTrueIcon = $icon;
    }

    /**
     * Set the default icon for the "false" value.
     */
    public static function setDefaultFalseIcon(?string $icon = null): void
    {
        static::$defaultFalseIcon = $icon;
    }

    /**
     * Set the icon for the "true" value.
     */
    public function trueIcon(string $icon): static
    {
        $this->trueIcon = $icon;

        return $this;
    }

    /**
     * Set the icon for the "false" value.
     */
    public function falseIcon(string $icon): static
    {
        $this->falseIcon = $icon;

        return $this;
    }

    /**
     * Get the icon for the "true" value.
     */
    protected function getTrueIcon(): ?string
    {
        return $this->trueIcon ?? static::$defaultTrueIcon;
    }

    /**
     * Get the icon for the "false" value.
     */
    protected function getFalseIcon(): ?string
    {
        return $this->falseIcon ?? static::$defaultFalseIcon;
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
     * {@inheritDoc}
     */
    public function mapForTable(mixed $value, Table $table, mixed $source = null): mixed
    {
        $bool = (bool) $value;

        if ($bool && $this->getTrueIcon()) {
            return $bool;
        }

        if (! $bool && $this->getFalseIcon()) {
            return $bool;
        }

        return parent::mapForTable($value, $table, $source);
    }

    /**
     * {@inheritDoc}
     */
    protected function mapValue(mixed $value, Table $table, mixed $source = null): mixed
    {
        return $value ? $this->getTrueLabel() : $this->getFalseLabel();
    }

    /**
     * {@inheritDoc}
     */
    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'trueIcon'  => $this->getTrueIcon(),
            'falseIcon' => $this->getFalseIcon(),
        ]);
    }
}
