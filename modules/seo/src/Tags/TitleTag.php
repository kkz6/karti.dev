<?php

namespace Modules\Seo\Tags;

class TitleTag extends Tag
{
    public function __construct(
        protected string $title
    ) {}

    public function render(): string
    {
        return "<title>{$this->title}</title>";
    }
}
