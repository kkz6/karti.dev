<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

use Illuminate\Support\Carbon;
use Modules\Table\Table;

class DateColumn extends Column
{
    /**
     * A default format for the column.
     */
    protected static ?string $defaultFormat = null;

    /**
     * The format for the column.
     */
    protected ?string $format = null;

    /**
     * Let Carbon translate the formatted value by default.
     */
    protected static bool $defaultTranslate = false;

    /**
     * Let Carbon translate the formatted value.
     */
    protected ?bool $translate = null;

    /**
     * Set the default format for the column.
     */
    public static function setDefaultFormat(?string $format = null): void
    {
        static::$defaultFormat = $format;
    }

    /**
     * Let Carbon translate the formatted value by default.
     */
    public static function setDefaultTranslate(bool $translate = true): void
    {
        static::$defaultTranslate = $translate;
    }

    /**
     * Set the format for the column.
     */
    public function format(string $format): static
    {
        $this->format = $format;

        return $this;
    }

    /**
     * Let Carbon translate the formatted value.
     */
    public function translate(?bool $translate = true): static
    {
        $this->translate = $translate;

        return $this;
    }

    /**
     * Get the format for the column.
     */
    protected function getFormat(): string
    {
        return $this->format ?? static::$defaultFormat ?? 'Y-m-d';
    }

    /**
     * Indicates if the formatted value should be translated.
     */
    protected function shouldTranslate(): bool
    {
        return $this->translate ?? static::$defaultTranslate;
    }

    /**
     * {@inheritDoc}
     */
    protected function mapValue(mixed $value, Table $table, mixed $source = null): mixed
    {
        if (! $value) {
            return null;
        }

        $date   = Carbon::parse($value);
        $format = $this->getFormat();

        return $this->shouldTranslate() ? $date->translatedFormat($format) : $date->format($format);
    }
}
