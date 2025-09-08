<?php

namespace Modules\Seo\Tags;

use Modules\Seo\SchemaCollection;

class SchemaTag extends Tag
{
    public function __construct(
        protected SchemaCollection $schema
    ) {}

    public function render(): string
    {
        $json = $this->schema->toJson();

        return "<script type=\"application/ld+json\">{$json}</script>";
    }
}
