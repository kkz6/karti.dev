<title inertia>{{ $seo['title'] ?? config('app.name', 'Laravel') }}</title>

@if (! empty($seo['description']))
    <meta name="description" content="{{ $seo['description'] }}" inertia="description">
@endif
@if (! empty($seo['author']))
    <meta name="author" content="{{ $seo['author'] }}" inertia="author">
@endif
@if (! empty($seo['robots']))
    <meta name="robots" content="{{ $seo['robots'] }}" inertia="robots">
@endif

@if (! empty($seo['title']))
    <meta property="og:title" content="{{ $seo['title'] }}" inertia="og:title">
@endif
@if (! empty($seo['description']))
    <meta property="og:description" content="{{ $seo['description'] }}" inertia="og:description">
@endif
@if (! empty($seo['image']))
    <meta property="og:image" content="{{ $seo['image'] }}" inertia="og:image">
@endif
@if (! empty($seo['url']))
    <meta property="og:url" content="{{ $seo['url'] }}" inertia="og:url">
@endif
@if (! empty($seo['type']))
    <meta property="og:type" content="{{ $seo['type'] }}" inertia="og:type">
@endif
@if (! empty($seo['site_name']))
    <meta property="og:site_name" content="{{ $seo['site_name'] }}" inertia="og:site_name">
@endif
@if (! empty($seo['locale']))
    <meta property="og:locale" content="{{ $seo['locale'] }}" inertia="og:locale">
@endif

@if (! empty($seo['twitter_card']))
    <meta name="twitter:card" content="{{ $seo['twitter_card'] }}" inertia="twitter:card">
@endif
@if (! empty($seo['title']))
    <meta name="twitter:title" content="{{ $seo['title'] }}" inertia="twitter:title">
@endif
@if (! empty($seo['description']))
    <meta name="twitter:description" content="{{ $seo['description'] }}" inertia="twitter:description">
@endif
@if (! empty($seo['image']))
    <meta name="twitter:image" content="{{ $seo['image'] }}" inertia="twitter:image">
@endif
@if (! empty($seo['twitter_site']))
    <meta name="twitter:site" content="{{ $seo['twitter_site'] }}" inertia="twitter:site">
@endif
@if (! empty($seo['twitter_creator']))
    <meta name="twitter:creator" content="{{ $seo['twitter_creator'] }}" inertia="twitter:creator">
@endif

@if (! empty($seo['url']))
    <link rel="canonical" href="{{ $seo['url'] }}" inertia="canonical">
@endif

@if (is_array($jsonLd ?? null))
    <script type="application/ld+json" inertia="json-ld">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) !!}</script>
@endif
