<?php

namespace Modules\Media\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Media\Models\Media;
use Modules\Media\Support\ResponsiveImages;

class GenerateResponsiveImages implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 180;

    public function __construct(public int $mediaId, public bool $force = false) {}

    public function handle(ResponsiveImages $images): void
    {
        // presets() handles missing settings during rolling deployments.
        app()->forgetInstance(\Modules\Settings\Settings\MediaSettings::class);
        $media = Media::find($this->mediaId);
        if (! $media || ! $images->supports($media)) {
            return;
        }
        foreach ($images->presets() as $preset) {
            $images->generate($media, $preset['name'], $this->force);
        }
    }
}
