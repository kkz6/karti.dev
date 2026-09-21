<?php

namespace Modules\Frontend\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Events\ContactSubmissionReceived;
use Modules\Frontend\Http\Requests\StoreContactSubmissionRequest;
use Modules\Frontend\Models\ContactSubmission;
use Modules\Frontend\Services\Turnstile;
use Modules\Seo\Support\SEOData;

class ContactController
{
    public function create(Request $request, Turnstile $turnstile): Response
    {
        $topics       = $this->topics();
        $defaultTopic = (string) $request->query('topic', 'general');
        $defaultTopic = array_key_exists($defaultTopic, $topics) ? $defaultTopic : 'general';
        $seoData      = new SEOData(
            title: 'Contact - '.config('seo.site_name', config('app.name')),
            description: 'Send Karthick a message about a project, consulting, speaking, or another question.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: route('contact'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::contact', [
            'topics'       => collect($topics)->map(fn (string $label, string $value) => compact('value', 'label'))->values(),
            'defaultTopic' => $defaultTopic,
            'contactForm'  => [
                'startedAt' => Crypt::encryptString((string) now()->timestamp),
            ],
            'captcha' => [
                'enabled' => $turnstile->enabled(),
                'siteKey' => $turnstile->enabled() ? $turnstile->siteKey() : null,
            ],
            'status' => $request->session()->get('contact_status'),
            'seo'    => $this->seoArray($seoData),
        ]);
    }

    public function store(StoreContactSubmissionRequest $request): RedirectResponse
    {
        $validated = $request->safe()->except(['website', 'started_at', 'turnstile_token']);

        $submission = DB::transaction(function () use ($request, $validated): ContactSubmission {
            $submission = ContactSubmission::create([
                ...$validated,
                'source_url' => $this->trustedSourceUrl($request, $validated['source_url'] ?? null),
                'ip_hash'    => hash_hmac('sha256', (string) ($request->ip() ?? 'unknown'), (string) config('app.key')),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000, ''),
            ]);

            ContactSubmissionReceived::dispatch($submission);

            return $submission;
        });

        return to_route('contact')->with('contact_status', [
            'message'   => 'Your message has been sent. I will get back to you as soon as I can.',
            'reference' => Str::upper(Str::substr($submission->id, 0, 8)),
        ]);
    }

    private function trustedSourceUrl(Request $request, mixed $sourceUrl): ?string
    {
        if (! is_string($sourceUrl) || filter_var($sourceUrl, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        return parse_url($sourceUrl, PHP_URL_HOST) === $request->getHost() ? $sourceUrl : null;
    }

    private function topics(): array
    {
        return [
            'general'    => 'General question',
            'project'    => 'Project enquiry',
            'consulting' => 'Consulting',
            'visa'       => 'Visa support',
            'speaking'   => 'Speaking invitation',
            'other'      => 'Something else',
        ];
    }

    private function seoArray(SEOData $seoData): array
    {
        return [
            'title'           => $seoData->title,
            'description'     => $seoData->description,
            'author'          => $seoData->author,
            'image'           => $seoData->image ? url($seoData->image) : null,
            'url'             => $seoData->url,
            'type'            => $seoData->type,
            'site_name'       => $seoData->site_name,
            'twitter_card'    => $seoData->twitter_card,
            'twitter_site'    => $seoData->twitter_site,
            'twitter_creator' => $seoData->twitter_creator,
            'robots'          => $seoData->robots,
            'locale'          => $seoData->locale,
        ];
    }
}
