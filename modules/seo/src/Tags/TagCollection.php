<?php

namespace Modules\Seo\Tags;

use Illuminate\Support\Collection;

class TagCollection extends Collection
{
    public function render(): string
    {
        return $this->map(fn(Tag $tag) => $tag->render())->implode("\n");
    }

    public function __toString(): string
    {
        return $this->render();
    }
}
