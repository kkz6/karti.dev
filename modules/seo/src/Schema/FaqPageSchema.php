<?php

namespace Modules\Seo\Schema;

use Closure;
use Illuminate\Support\Collection;

class FaqPageSchema
{
    protected Collection $questions;
    protected Collection $markup;

    public function __construct()
    {
        $this->questions = new Collection();
        $this->markup = new Collection([
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
        ]);
    }

    public function addQuestion(string $name, string $acceptedAnswer): self
    {
        $this->questions->push([
            '@type' => 'Question',
            'name' => $name,
            'acceptedAnswer' => [
                '@type' => 'Answer',
                'text' => $acceptedAnswer,
            ],
        ]);

        return $this;
    }

    public function markup(Closure $callback): self
    {
        $this->markup = $callback($this->markup);

        return $this;
    }

    public function toArray(): array
    {
        return $this->markup->merge([
            'mainEntity' => $this->questions->toArray(),
        ])->toArray();
    }
}
