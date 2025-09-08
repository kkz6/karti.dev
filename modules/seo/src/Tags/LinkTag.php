<?php

namespace Modules\Seo\Tags;

class LinkTag extends Tag
{
    public function __construct(
        protected string $rel,
        protected string $href
    ) {}

    public function render(): string
    {
        return "<link rel=\"{$this->rel}\" href=\"{$this->href}\">";
    }
}
