<!DOCTYPE html>
<html lang="ko">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="robots" content="index, follow" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="{{ config('app.name') }}" />
        <meta name="twitter:card" content="summary_large_image" />
        @inertiaHead
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/service.jsx'])
    </head>
    <body class="overflow-x-hidden">
        @inertia
    </body>
</html>
