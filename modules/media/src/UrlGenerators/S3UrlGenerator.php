<?php

namespace Modules\Media\UrlGenerators;

class S3UrlGenerator extends BaseUrlGenerator implements TemporaryUrlGeneratorInterface
{
    protected FilesystemManager $filesystem;

    /**
     * Constructor.
     * @param \Illuminate\Contracts\Config\Repository $config
     * @param \Illuminate\Filesystem\FilesystemManager $filesystem
     */
    public function __construct(Config $config, FilesystemManager $filesystem)
    {
        parent::__construct($config);
        $this->filesystem = $filesystem;
    }

    /**
     * {@inheritdoc}
     */
    public function getAbsolutePath(): string
    {
        return $this->getUrl();
    }

    /**
     * {@inheritdoc}
     */
    public function getUrl(): string
    {
        /** @var Cloud $filesystem */
        $filesystem = $this->filesystem->disk($this->media->disk);
        return $filesystem->url($this->media->getDiskPath());
    }

    public function getTemporaryUrl(\DateTimeInterface $expiry): string
    {
        $filesystem = $this->filesystem->disk($this->media->disk);
        return $filesystem->temporaryUrl($this->media->getDiskPath(), $expiry);
    }
}
