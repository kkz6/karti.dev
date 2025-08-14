<?php

declare(strict_types=1);

namespace Modules\Media\Exceptions\MediaUpload;

use Modules\Media\Exceptions\MediaUploadException;

class FileNotFoundException extends MediaUploadException
{
    public static function fileNotFound(string $path, ?\Throwable $original = null): self
    {
        return new self("File `{$path}` does not exist.", 0, $original);
    }

    public static function invalidDataUrl(): self
    {
        return new self('Invalid Data URL');
    }
}
