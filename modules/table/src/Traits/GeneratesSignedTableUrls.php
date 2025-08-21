<?php

declare(strict_types=1);

namespace Modules\Table\Traits;

use Illuminate\Support\Facades\URL;
use Modules\Table\Table;

trait GeneratesSignedTableUrls
{
    /**
     * Generate a signed URL for the given table and route name.
     */
    protected function generateSignedTableUrl(Table $table, string $name, array $parameters = []): string
    {
        $state = $table->getCachedState();

        return URL::signedRoute($name, [
            ...$parameters,
            'table' => base64_encode($table::class),
            'name'  => $table->getName(),
            ...(blank($state) ? [] : ['state' => $state]),
        ]);
    }
}
