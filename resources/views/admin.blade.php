<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <title>KRLived Admin</title>
        @routes
        @inertiaHead
        @viteReactRefresh
        @vite(['resources/css/admin.css', 'resources/js/admin.jsx'])
    </head>
    <body class="bg-gray-100">
        @inertia
    </body>
</html>
