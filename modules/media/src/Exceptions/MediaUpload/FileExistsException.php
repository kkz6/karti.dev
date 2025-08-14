<?php

declare(strict_types=1);

namespace Modules\Media\Exceptions\MediaUpload;

use Modules\Media\Exceptions\MediaUploadException;

class FileExistsException extends MediaUploadException
{
    public static function fileExists(string $path): self
    {
        return new self("A file already exists at `{$path}`.");
    }
}
