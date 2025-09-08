<?php

namespace Modules\Seo\Tags;

abstract class Tag
{
    abstract public function render(): string;

    public function __toString(): string
    {
        return $this->render();
    }
}
