<?php

namespace Modules\Seo\Tags;

class MetaTag extends Tag
{
    public function __construct(
        protected string $name,
        protected string $content,
        protected ?string $property = null
    ) {}

    public function render(): string
    {
        // Check if this is an OpenGraph or Twitter meta tag
        if (str_starts_with($this->name, 'og:') || str_starts_with($this->name, 'twitter:')) {
            return "<meta property=\"{$this->name}\" content=\"{$this->content}\">";
        }

        return "<meta name=\"{$this->name}\" content=\"{$this->content}\">";
    }
}
