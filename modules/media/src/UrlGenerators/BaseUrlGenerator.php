<?php

namespace Modules\Media\UrlGenerators;

use Illuminate\Contracts\Config\Repository as Config;
use Modules\Media\Interfaces\UrlGeneratorInterface;
use Modules\Media\Models\Media;

abstract class BaseUrlGenerator implements UrlGeneratorInterface
{
    protected Config $config;

    /**
     * Media instance being linked.
     */
    protected ?Media $media = null;

    /**
     * Constructor.
     */
    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    /**
     * Set the media being operated on.
     */
    public function setMedia(Media $media): void
    {
        $this->media = $media;
    }

    /**
     * {@inheritdoc}
     */
    public function isPubliclyAccessible(): bool
    {
        return $this->getDiskConfig('visibility', 'private') == 'public' && $this->media->isVisible();
    }

    /**
     * Get a config value for the current disk.
     *
     * @param mixed $default
     */
    protected function getDiskConfig(string $key, $default = null): mixed
    {
        return $this->config->get("filesystems.disks.{$this->media->disk}.{$key}", $default);
    }
}
