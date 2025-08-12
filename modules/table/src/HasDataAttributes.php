<?php

declare(strict_types=1);

namespace Modules\Table;

/**
 * @property ?array $dataAttributes
 */
trait HasDataAttributes
{
    /**
     * Set the Data Attributes.
     */
    public function dataAttributes(array $dataAttributes): static
    {
        $this->dataAttributes = $dataAttributes;

        return $this;
    }

    /**
     * Build the data attributes for use in the frontend.
     */
    public function buildDataAttributes(): ?array
    {
        return Html::formatDataAttributes($this->dataAttributes);
    }
}
