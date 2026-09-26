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

        @if (! request()->is('admin', 'admin/*') && is_array(data_get($page, 'props.seo')))
            @include('partials.seo', [
                'seo' => data_get($page, 'props.seo'),
                'jsonLd' => data_get($page, 'props.jsonLd'),
            ])
        @else
            <title inertia>{{ config('app.name', 'Laravel') }}</title>
        @endif

        <link rel="icon" href="{{ config('site.public.favicon', '/favicon.ico') }}" sizes="any" inertia="site-favicon">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

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
        @unless (request()->routeIs('newsletter.*'))
        <!-- Keep signed newsletter links out of third-party analytics. -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZB97KEKN54"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZB97KEKN54');
        </script>
        @endunless
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
