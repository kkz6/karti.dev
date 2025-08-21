<?php

declare(strict_types=1);

namespace Modules\Table\Traits;

use DateInterval;
use DateTimeInterface;
use Illuminate\Support\Facades\URL as UrlGenerator;

trait HasUrl
{
    /**
     * Set the URL.
     */
    public function to(?string $url = null): self
    {
        $this->url = blank($url) ? null : $url;

        return $this;
    }

    /**
     * Alias of the `to` method.
     */
    public function url(?string $url = null): self
    {
        return $this->to($url);
    }

    /**
     * Set the URL using a named route.
     */
    public function route(string $route, mixed $parameters = [], bool $absolute = true): self
    {
        return $this->to(
            route($route, $parameters, $absolute)
        );
    }

    /**
     * Set the URL using a signed route.
     */
    public function signedRoute(string $name, mixed $parameters = [], DateTimeInterface|DateInterval|int|null $expiration = null, bool $absolute = true): self
    {
        return $this->to(
            UrlGenerator::signedRoute($name, $parameters, $expiration, $absolute)
        );
    }

    /**
     * Set the URL using a temporary signed route.
     */
    public function temporarySignedRoute(string $name, DateTimeInterface|DateInterval|int $expiration, mixed $parameters = [], bool $absolute = true): self
    {
        return $this->to(
            UrlGenerator::temporarySignedRoute($name, $expiration, $parameters, $absolute)
        );
    }
}
