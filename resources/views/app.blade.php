<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
            (function() {
                // Check localStorage first (user preference)
                const savedTheme = localStorage.getItem('theme');

                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (savedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    // No saved preference, check system preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        <style>
            html {
                background-color: white;
            }

            html.dark {
                background-color: rgb(24, 24, 27);
            }

            body {
                background-color: transparent;
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- OpenGraph Meta Tags (fallback for SSR) --}}
        @if(isset($page['props']['seo']))
            @php $seo = $page['props']['seo']; @endphp
            @if(!empty($seo['title']))<meta property="og:title" content="{{ $seo['title'] }}">@endif
            @if(!empty($seo['description']))<meta property="og:description" content="{{ $seo['description'] }}">@endif
            @if(!empty($seo['image']))<meta property="og:image" content="{{ $seo['image'] }}">@endif
            @if(!empty($seo['url']))<meta property="og:url" content="{{ $seo['url'] }}">@endif
            @if(!empty($seo['type']))<meta property="og:type" content="{{ $seo['type'] }}">@endif
            @if(!empty($seo['site_name']))<meta property="og:site_name" content="{{ $seo['site_name'] }}">@endif
            @if(!empty($seo['locale']))<meta property="og:locale" content="{{ $seo['locale'] }}">@endif
            @if(!empty($seo['description']))<meta name="description" content="{{ $seo['description'] }}">@endif
            @if(!empty($seo['author']))<meta name="author" content="{{ $seo['author'] }}">@endif
            {{-- Twitter Card --}}
            @if(!empty($seo['twitter_card']))<meta name="twitter:card" content="{{ $seo['twitter_card'] }}">@endif
            @if(!empty($seo['title']))<meta name="twitter:title" content="{{ $seo['title'] }}">@endif
            @if(!empty($seo['description']))<meta name="twitter:description" content="{{ $seo['description'] }}">@endif
            @if(!empty($seo['image']))<meta name="twitter:image" content="{{ $seo['image'] }}">@endif
            @if(!empty($seo['twitter_site']))<meta name="twitter:site" content="{{ $seo['twitter_site'] }}">@endif
            @if(!empty($seo['twitter_creator']))<meta name="twitter:creator" content="{{ $seo['twitter_creator'] }}">@endif
            {{-- Canonical URL --}}
            @if(!empty($seo['url']))<link rel="canonical" href="{{ $seo['url'] }}">@endif
        @endif

        {{-- JSON-LD Structured Data --}}
        @if(isset($page['props']['jsonLd']))
            <script type="application/ld+json">{!! json_encode($page['props']['jsonLd'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="stylesheet" href="https://rsms.me/inter/inter.css">

        @routes
        @viteReactRefresh
        @if (count(explode('::', $page['component'])) > 1)
            @php
                $module = explode('::', $page['component'])[0];

                $moduleLower = strtolower($module);

                $path = explode('::', $page['component'])[1];
            @endphp
            @vite(['resources/js/app.tsx', "modules/$moduleLower/resources/js/pages/$path.tsx"])
        @else
            @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @endif
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
