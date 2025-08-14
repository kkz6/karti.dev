<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Support\Str;

class Html
{
    /**
     * Format the Data Attributes for use in the frontend.
     */
    public static function formatDataAttributes(?array $dataAttributes = null): ?array
    {
        if (blank($dataAttributes)) {
            return null;
        }

        return collect($dataAttributes)
            ->mapWithKeys(function ($value, $key): array {
                if (is_numeric($key)) {
                    $key   = $value;
                    $value = '';
                }

                return ['data-'.Str::kebab($key) => $value];
            })
            ->all();
    }

    /**
     * Format the CSS class for use in the frontend.
     */
    public static function formatCssClass(array|string|null $class): ?string
    {
        if (is_array($class)) {
            $class = collect($class)
                ->map(fn (string $class): string => trim($class))
                ->filter()
                ->unique()
                ->implode(' ');
        }

        return blank($class) ? null : trim($class);
    }
}
