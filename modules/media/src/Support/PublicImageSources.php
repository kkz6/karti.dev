<?php

namespace Modules\Media\Support;

use DOMDocument;
use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;

class PublicImageSources
{
    /** Resolve only this site's public media URLs. Never fetch arbitrary remote images. */
    public function mediaForUrls(array $urls): array
    {
        $base   = Storage::disk('public')->url('');
        $prefix = rtrim(parse_url($base, PHP_URL_PATH) ?: '', '/').'/';
        $host   = parse_url(url($base), PHP_URL_HOST);
        $paths  = [];
        foreach (array_unique($urls) as $url) {
            $urlHost = parse_url($url, PHP_URL_HOST);
            $path    = rawurldecode(parse_url($url, PHP_URL_PATH) ?: '');
            if (($urlHost && $urlHost !== $host) || ! str_starts_with($path, $prefix)) {
                continue;
            }
            $paths[$url] = substr($path, strlen($prefix));
        }
        if (! $paths) {
            return [];
        }
        $media = Media::where('disk', 'public')->whereNull('original_media_id')
            ->whereIn('filename', array_map(fn ($path) => pathinfo($path, PATHINFO_FILENAME), $paths))
            ->with('variants')->get()->keyBy(fn ($image) => $image->getDiskPath());
        $result = [];
        foreach ($paths as $url => $path) {
            if (isset($media[$path])) {
                $result[$url] = $media[$path];
            }
        }

        return $result;
    }

    public function html(string $html): string
    {
        if (! str_contains($html, '<img')) {
            return $html;
        }
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            $document->loadHTML('<?xml encoding="UTF-8"><div id="media-content-root">'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
        $images = iterator_to_array($document->getElementsByTagName('img'));
        $media  = $this->mediaForUrls(array_map(fn ($image) => $image->getAttribute('src'), $images));
        foreach ($images as $image) {
            $asset = $media[$image->getAttribute('src')] ?? null;
            if (! $asset || ! app(ResponsiveImages::class)->supports($asset)) {
                continue;
            }
            $image->setAttribute('src', $asset->imageUrl('content'));
            $image->removeAttribute('srcset');
            $image->setAttribute('data-full-src', $asset->getUrl());
            $image->setAttribute('loading', 'lazy');
            $image->setAttribute('decoding', 'async');
        }
        $root = $document->getElementById('media-content-root');

        return $root ? implode('', array_map(fn ($node) => $document->saveHTML($node), iterator_to_array($root->childNodes))) : $html;
    }
}
