<?php

namespace Modules\Media\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Media\Models\Media;

class RebuildResponsiveImages implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Media::whereNull('original_media_id')->whereIn('mime_type', ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
            ->select('id')->chunkById(100, function ($media) {
                foreach ($media as $image) {
                    GenerateResponsiveImages::dispatch($image->id, force: true);
                }
            });
    }
}
