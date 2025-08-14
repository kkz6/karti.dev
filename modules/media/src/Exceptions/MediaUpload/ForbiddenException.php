<?php

declare(strict_types=1);

namespace Modules\Media\Exceptions\MediaUpload;

use Modules\Media\Exceptions\MediaUploadException;

class ForbiddenException extends MediaUploadException
{
    public static function diskNotAllowed(string $disk): self
    {
        return new self("The disk `{$disk}` is not in the allowed disks for media.");
    }
}
