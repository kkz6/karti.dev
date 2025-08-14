<?php
declare(strict_types=1);

namespace Modules\Media\Exceptions\MediaUpload;

use Modules\Media\Exceptions\MediaUploadException;

class FileSizeException extends MediaUploadException
{
    public static function fileIsTooBig(int $size, int $max): self
    {
        return new self("File is too big ({$size} bytes). Maximum upload size is {$max} bytes.");
    }
}
