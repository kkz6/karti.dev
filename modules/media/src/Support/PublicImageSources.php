<?php

namespace Modules\Media\Support;

use DOMDocument;
use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;
use Modules\Media\Models\MediaUrlHistory;

class PublicImageSources
{
    /** Resolve only this site's configured media URLs. Never fetch arbitrary remote images. */
    public function mediaForUrls(array $urls): array
    {
        $result = [];
        $urls   = array_unique(array_filter($urls));
        $disks  = array_unique([
            config('mediable.default_disk'),
            ...config('mediable.allowed_disks', []),
        ]);

        foreach (array_filter($disks) as $disk) {
            $base   = Storage::disk($disk)->url('');
            $prefix = rtrim(parse_url($base, PHP_URL_PATH) ?: '', '/').'/';
            $host   = parse_url(url($base), PHP_URL_HOST);
            $paths  = [];

            foreach ($urls as $sourceUrl) {
                $urlHost = parse_url($sourceUrl, PHP_URL_HOST);
                $path    = rawurldecode(parse_url($sourceUrl, PHP_URL_PATH) ?: '');
                if (($urlHost && $urlHost !== $host) || ! str_starts_with($path, $prefix)) {
                    continue;
                }
                $paths[$sourceUrl] = ltrim(substr($path, strlen($prefix)), '/');
            }

            if (! $paths) {
                continue;
            }

            $media = Media::where('disk', $disk)->whereNull('original_media_id')
                ->whereIn('filename', array_map(fn ($path) => pathinfo($path, PATHINFO_FILENAME), $paths))
                ->with('variants')->get()->keyBy(fn ($image) => $image->getDiskPath());

            foreach ($paths as $sourceUrl => $path) {
                if (isset($media[$path])) {
                    $result[$sourceUrl] = $media[$path];
                }
            }

            if ($disk !== 'public') {
                continue;
            }

            $missing = array_filter($paths, fn ($path, $sourceUrl) => ! isset($result[$sourceUrl]), ARRAY_FILTER_USE_BOTH);
            $aliases = $missing
                ? MediaUrlHistory::whereIn('path_hash', array_map(fn ($path) => hash('sha256', $prefix.$path), $missing))->get()->keyBy('path_hash')
                : collect();
            $moved = $aliases->isNotEmpty()
                ? Media::where('disk', 'public')->whereIn('id', $aliases->pluck('media_id'))->with('variants')->get()->keyBy('id')
                : collect();

            foreach ($missing as $sourceUrl => $path) {
                $alias = $aliases->get(hash('sha256', $prefix.$path));
                if ($alias && ($asset = $moved->get($alias->media_id)) && $asset->fileExists() && $asset->isVisible()) {
                    $result[$sourceUrl] = $asset;
                }
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
