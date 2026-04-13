<?php echo '<?xml version="1.0" encoding="UTF-8"?>'; ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($posts as $post)
    <url>
        <loc>{{ url('/post/' . $post->post_id) }}</loc>
        <lastmod>{{ substr($post->updated_at ?? $post->created_at, 0, 10) }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
@endforeach
</urlset>
