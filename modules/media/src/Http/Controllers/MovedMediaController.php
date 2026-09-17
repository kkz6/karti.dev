<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;
use Modules\Media\Models\MediaUrlHistory;

class MovedMediaController
{
    public function __invoke(string $path)
    {
        // Only redirects for recorded public files, never arbitrary filesystem paths.
        abort_unless(config('filesystems.disks.public.visibility') === 'public', 404);
        $prefix  = rtrim(parse_url(Storage::disk('public')->url(''), PHP_URL_PATH) ?: '', '/');
        $history = MediaUrlHistory::where('path_hash', hash('sha256', $prefix.'/'.$path))->firstOrFail();
        $media   = Media::findOrFail($history->media_id);
        abort_unless($media->disk === 'public' && $media->isVisible() && Storage::disk('public')->exists($media->getDiskPath()), 404);
        // Resolve directly to the latest location even after several moves.
        abort_if(rawurldecode(parse_url($media->getUrl(), PHP_URL_PATH) ?: '') === $history->path, 404);

        return redirect()->away($media->getUrl(), 302)->header('Cache-Control', 'no-store');
    }
}
