<?php

namespace Modules\Media\SourceAdapters;

use GuzzleHttp\Psr7\Utils;
use Modules\Media\Exceptions\MediaUpload\ConfigurationException;
use Modules\Media\Interfaces\SourceAdapterInterface;
use Psr\Http\Message\StreamInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Uploaded File Adapter.
 *
 * Adapts the UploadedFile class from Symfony Components.
 */
class UploadedFileAdapter implements SourceAdapterInterface
{
    protected UploadedFile $uploadedFile;

    /**
     * Constructor.
     * @param UploadedFile $source
     */
    public function __construct(UploadedFile $source)
    {
        if (!$source->isValid()) {
            throw ConfigurationException::invalidSource(
                "Uploaded file is not valid: {$source->getErrorMessage()}"
            );
        }
        $this->uploadedFile = $source;
    }

    /**
     * {@inheritdoc}
     */
    public function filename(): ?string
    {
        return pathinfo($this->uploadedFile->getClientOriginalName(), PATHINFO_FILENAME) ?: null;
    }

    /**
     * {@inheritdoc}
     */
    public function extension(): ?string
    {
        return $this->uploadedFile->getClientOriginalExtension() ?: null;
    }

    /**
     * {@inheritdoc}
     */
    public function mimeType(): string
    {
        return $this->uploadedFile->getMimeType();
    }

    public function clientMimeType(): ?string
    {
        return $this->uploadedFile->getClientMimeType();
    }

    /**
     * {@inheritdoc}
     */
    public function getStream(): StreamInterface
    {
        return Utils::streamFor(fopen($this->uploadedFile->getRealPath(), 'rb'));
    }

    /**
     * {@inheritdoc}
     */
    public function size(): int
    {
        return $this->uploadedFile->getSize() ?: 0;
    }

    /**
     * {@inheritdoc}
     * @param string $algo
     */
    public function hash(string $algo = 'md5'): string
    {
        return hash_file($algo, $this->uploadedFile->getRealPath());
    }
}
