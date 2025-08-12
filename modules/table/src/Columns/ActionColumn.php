<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

class ActionColumn extends Column
{
    /**
     * Whether the actions should be displayed as a dropdown.
     */
    protected ?bool $asDropdown = null;

    /**
     * Whether the actions should be displayed as a dropdown by default.
     */
    protected static bool $defaultAsDropdown = false;

    /**
     * Create a new instance with the given label.
     */
    public static function new(string $label = '', ?bool $asDropdown = null): ActionColumn
    {
        return static::make(
            attribute: '_actions',
            header: $label,
            toggleable: false,
            alignment: ColumnAlignment::Right
        )->asDropdown($asDropdown ?? static::$defaultAsDropdown);
    }

    /**
     * Set whether the actions should be displayed as a dropdown by default.
     */
    public static function defaultAsDropdown(bool $value = true): void
    {
        static::$defaultAsDropdown = $value;
    }

    /**
     * Set whether the actions should be displayed as a dropdown.
     */
    public function asDropdown(bool $value = true): self
    {
        $this->asDropdown = $value;

        return $this;
    }

    /**
     * Always return the same constant attribute.
     */
    public function getAttribute(): string
    {
        return '_actions';
    }

    /**
     * Disallow changing the attribute.
     */
    public function attribute(string $attribute): self
    {
        return $this;
    }

    /**
     * Never export the column.
     */
    public function shouldBeExported(): bool
    {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'asDropdown' => $this->asDropdown ?? static::$defaultAsDropdown,
        ]);
    }
}
