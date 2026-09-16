<?php

namespace Modules\Analytics\Services;

use DeviceDetector\Cache\LaravelCache;
use DeviceDetector\DeviceDetector;
use Illuminate\Http\Request;
use Modules\Analytics\Models\PageView;
use Symfony\Component\HttpFoundation\Response;

class RecordPageView
{
    public function record(Request $request, Response $response): void
    {
        if (! config('traffic.enabled') || ! $request->isMethod('GET') || $response->getStatusCode() !== 200
            || ! in_array($request->route()?->getName(), config('traffic.routes', []), true)
            || $request->user() || $request->header('DNT') === '1' || $request->header('Sec-GPC') === '1'
            || $request->hasHeader('X-Inertia-Partial-Data')
            || str_contains(strtolower($request->header('Purpose', '').' '.$request->header('Sec-Purpose', '')), 'prefetch')
            || (! str_contains($response->headers->get('Content-Type', ''), 'text/html') && ! $response->headers->has('X-Inertia'))) {
            return;
        }

        $ip        = $request->ip();
        $userAgent = $request->userAgent();
        if (! $ip || ! filter_var($ip, FILTER_VALIDATE_IP) || ! $userAgent || ! config('app.key')) {
            return;
        }

        $detector = new DeviceDetector(substr($userAgent, 0, 2048));
        $detector->setCache(new LaravelCache);
        $detector->discardBotInformation();
        $detector->parse();
        if ($detector->isBot() || ! $detector->isBrowser()) {
            return;
        }

        $now  = now('UTC');
        $path = '/'.ltrim($request->path(), '/');
        if (strlen($path) > 512) {
            return;
        }
        // No raw IP, user-agent, query string or cross-day identifier is stored.
        $visitor  = hash_hmac('sha256', $now->toDateString().'|'.bin2hex(inet_pton($ip)), config('app.key'));
        $bucket   = intdiv($now->timestamp, max(1, (int) config('traffic.deduplicate_seconds', 60)));
        $referrer = parse_url($request->header('Referer', ''), PHP_URL_HOST);
        $referrer = is_string($referrer) ? strtolower($referrer) : null;
        if ($referrer === strtolower($request->getHost())) {
            $referrer = null;
        }

        PageView::query()->insertOrIgnore([
            ...app(ContentTraffic::class)->identify($request),
            'event_key'     => hash('sha256', $visitor.'|'.$path.'|'.$bucket),
            'visitor_hash'  => $visitor,
            'viewed_on'     => $now->toDateString(),
            'viewed_at'     => $now,
            'path'          => $path,
            'referrer_host' => $referrer ? substr($referrer, 0, 255) : null,
            'browser'       => substr($detector->getClient('name') ?: 'Unknown', 0, 100),
            'platform'      => substr($detector->getOs('name') ?: 'Unknown', 0, 100),
            'device'        => substr($detector->getDeviceName() ?: 'Unknown', 0, 50),
        ]);
    }
}
