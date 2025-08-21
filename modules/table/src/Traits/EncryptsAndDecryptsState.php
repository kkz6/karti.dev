<?php

declare(strict_types=1);

namespace Modules\Table\Traits;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Queue\SerializesAndRestoresModelIdentifiers;
use Illuminate\Support\Collection;
use Modules\Table\InvalidStateException;
use Modules\Table\Remember;
use ReflectionClass;
use ReflectionParameter;
use ReflectionProperty;

trait EncryptsAndDecryptsState
{
    use SerializesAndRestoresModelIdentifiers;

    /**
     * The cached state of the properties marked with the Remember attribute.
     */
    protected ?string $encryptedStateCache = null;

    /**
     * Get an array with the serialized values of the properties marked with the Remember attribute.
     */
    protected function getConstructorParamsState(): array
    {
        $constructorParams = static::getConstructorParamsThatShouldBeRemembered($this);

        if ($constructorParams->isEmpty()) {
            return [];
        }

        $properties = collect((new ReflectionClass($this))->getProperties())
            ->reject(fn (ReflectionProperty $property): bool => $property->getAttributes(Remember::class) === [])
            ->keyBy(fn (ReflectionProperty $property): string => $property->getName());

        return $constructorParams
            ->filter(fn (ReflectionParameter $parameter) => $properties->has($parameter->getName()))
            ->mapWithKeys(fn (ReflectionParameter $parameter): array => [
                $parameter->getName() => $this->getSerializedPropertyValue($properties[$parameter->getName()]->getValue($this)),
            ])
            ->all();
    }

    /**
     * Get the serialized state of the properties marked with the Remember attribute.
     */
    public function getSerializedConstructorParamsState(): ?string
    {
        $state = $this->getConstructorParamsState();

        return empty($state) ? null : serialize($state);
    }

    /**
     * Get the encrypted state of the properties marked with the Remember attribute.
     */
    protected function getEncryptedConstructorParamsState(): ?string
    {
        $state = $this->getSerializedConstructorParamsState();

        return empty($state) ? null : encrypt(gzencode((string) $state, 9));
    }

    /**
     * Flush the cached state of the properties marked with the Remember attribute.
     */
    public function flushStateCache(): void
    {
        $this->encryptedStateCache = null;
    }

    /**
     * Wrapper to return the cached state of the properties marked with the Remember attribute.
     */
    public function getCachedState(): ?string
    {
        if ($this->encryptedStateCache !== null) {
            return $this->encryptedStateCache;
        }

        return $this->encryptedStateCache = ($this->getEncryptedConstructorParamsState() ?? '');
    }

    /**
     * Get the constructor parameters that should be remembered.
     */
    public static function getConstructorParamsThatShouldBeRemembered(object|string $class): Collection
    {
        return collect((new ReflectionClass($class))->getConstructor()?->getParameters() ?? [])
            ->reject(fn (ReflectionParameter $parameter): bool => $parameter->getAttributes(Remember::class) === []);
    }

    /**
     * Determine if the class has constructor parameters that should be remembered.
     */
    public static function hasConstructorParamsThatShouldBeRemembered(object|string $class): bool
    {
        return static::getConstructorParamsThatShouldBeRemembered($class)->isNotEmpty();
    }

    /**
     * Create a new Table instance from the encrypted state.
     */
    public static function fromEncryptedState(string $state): static
    {
        $restorer = new class
        {
            use SerializesAndRestoresModelIdentifiers;

            public function __invoke(mixed $value): mixed
            {
                return $this->getRestoredPropertyValue($value);
            }
        };

        try {
            /** @var array */
            $state = unserialize(gzdecode(decrypt($state)));
        } catch (DecryptException) {
            throw new InvalidStateException;
        }

        $requiredParams = static::getConstructorParamsThatShouldBeRemembered(static::class)
            ->map(fn (ReflectionParameter $parameter): string => $parameter->getName())
            ->all();

        if (count($state) !== count($requiredParams) || array_diff($requiredParams, array_keys($state))) {
            throw new InvalidStateException;
        }

        return collect($state)
            ->map(fn (mixed $value): mixed => $restorer($value))
            ->pipe(fn (Collection $params) => app()->make(static::class, $params->all()));
    }
}
