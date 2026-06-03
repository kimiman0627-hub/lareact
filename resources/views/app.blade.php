<!DOCTYPE html>
<html lang="ko">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="256x256" href="/favicon-256.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-apple.png" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="robots" content="index, follow" />
        <meta name="google-adsense-account" content="ca-pub-2524436697997672" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="{{ config('app.name') }}" />
        @php $kakaoKey = $siteSettings['kakao_js_key'] ?? config('config.kakao_js_key', '') @endphp
        @if($kakaoKey)
        <meta name="kakao-key" content="{{ $kakaoKey }}" />
        @endif
        <meta name="twitter:card" content="summary_large_image" />
        @inertiaHead
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/service.tsx'])
        @if(!empty($siteSettings['head_code']))
            {!! $siteSettings['head_code'] !!}
        @endif
    </head>
    <body class="overflow-x-hidden">
        @inertia
        @if(!empty($siteSettings['footer_code']))
            {!! $siteSettings['footer_code'] !!}
        @endif
    </body>
</html>
