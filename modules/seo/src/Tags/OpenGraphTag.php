<?php

namespace Modules\Seo\Tags;

class OpenGraphTag extends Tag
{
    public function __construct(
        protected string $property,
        protected string $content
    ) {}

    public function render(): string
    {
        return "<meta property=\"{$this->property}\" content=\"{$this->content}\">";
    }
}
