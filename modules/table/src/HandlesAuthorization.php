<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

/**
 * @property Closure|bool $authorize
 */
trait HandlesAuthorization
{
    /**
     * Returns a boolean indicating whether the table is authorized.
     */
    public function isAuthorized(?Request $request = null): bool
    {
        if ($this->authorize instanceof Closure) {
            return App::call($this->authorize, $request instanceof Request ? ['request' => $request] : []);
        }

        return $this->authorize;
    }

    /**
     * Set the callback or boolean to be used to authorize the table.
     */
    public function authorize(bool|Closure $authorize): static
    {
        $this->authorize = $authorize;

        return $this;
    }
}
