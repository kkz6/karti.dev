<?php

namespace Modules\Media\UrlGenerators;

use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Contracts\Filesystem\Cloud;
use Illuminate\Filesystem\FilesystemManager;
use Modules\Media\Exceptions\MediaUrlException;

class LocalUrlGenerator extends BaseUrlGenerator
{
    protected FilesystemManager $filesystem;

    /**
     * Constructor.
     */
    public function __construct(Config $config, FilesystemManager $filesystem)
    {
        parent::__construct($config);
        $this->filesystem = $filesystem;
    }

    /**
     * {@inheritdoc}
     */
    public function isPubliclyAccessible(): bool
    {
        return ($this->getDiskConfig('visibility', 'private') == 'public' || $this->isInWebroot())
            && $this->media->isVisible();
    }

    /**
     * {@inheritdoc}
     *
     * @throws MediaUrlException If media's disk is not publicly accessible
     */
    public function getUrl(): string
    {
        /** @var Cloud $filesystem */
        $filesystem = $this->filesystem->disk($this->media->disk);

        return $filesystem->url($this->media->getDiskPath());
    }

    /**
     * {@inheritdoc}
     */
    public function getAbsolutePath(): string
    {
        return $this->getDiskConfig('root').DIRECTORY_SEPARATOR.$this->media->getDiskPath();
    }

    private function isInWebroot(): bool
    {
        return strpos($this->getAbsolutePath(), public_path()) === 0;
    }
}
