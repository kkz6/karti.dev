<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;

class Helpers
{
    /**
     * Ensure the given model class is a valid Eloquent model class.
     *
     * @throws InvalidArgumentException
     */
    public static function ensureClassIsModelClass(?string $modelClass = null): ?string
    {
        if (blank($modelClass)) {
            return null;
        }

        if (is_subclass_of($modelClass, Model::class)) {
            return $modelClass;
        }

        throw new InvalidArgumentException(
            sprintf('The model class "%s" must extend %s.', $modelClass, Model::class)
        );
    }

    /**
     * Convert a callable or Closure to a Closure instance.
     */
    public static function asClosure(Closure|callable|null $value): ?Closure
    {
        if (is_null($value)) {
            return null;
        }

        return $value instanceof Closure ? $value : Closure::fromCallable($value);
    }

    /**
     * Determine if the request is a partial reload.
     */
    public static function isPartialReload(?Request $request = null): bool
    {
        $request ??= request();

        return ! blank($request->header('X-Inertia-Partial-Data'));
    }
}
