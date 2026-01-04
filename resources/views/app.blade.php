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
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZB97KEKN54"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZB97KEKN54');
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
