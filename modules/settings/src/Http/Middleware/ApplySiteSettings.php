<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Modules\Settings\Settings\SiteSettings;
use Symfony\Component\HttpFoundation\Response;

class ApplySiteSettings
{
    public function handle(Request $request, Closure $next): Response
    {
        // Do not resolve database settings during application boot or before deployment migrations.
        $site   = Schema::hasTable('settings') ? app(SiteSettings::class)->toArray() : SiteSettings::defaults();
        $values = [
            'app.name'         => $site['name'],
            'seo.site_name'    => $site['name'],
            'seo.title'        => $site['title'],
            'seo.description'  => $site['description'],
            'seo.author'       => $site['author'],
            'seo.image'        => $site['image'],
            'seo.twitter.site' => $site['twitter_site'],
            'site.public'      => $site,
        ];
        $original = array_combine(array_keys($values), array_map(fn (string $key) => config($key), array_keys($values)));
        config($values);

        try {
            return $next($request);
        } finally {
            // Avoid leaking request-local configuration into long-lived workers.
            config($original);
        }
    }
}
