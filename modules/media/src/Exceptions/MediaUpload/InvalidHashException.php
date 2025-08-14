<?php

declare(strict_types=1);

namespace Modules\Media\Exceptions\MediaUpload;

use Modules\Media\Exceptions\MediaUploadException;

class InvalidHashException extends MediaUploadException
{
    public static function hashMismatch(string $algo, string $expectedhash, string $actualHash): self
    {
        return new self("File's $algo hash `{$actualHash}` does not match expected `{$expectedhash}`.");
    }
}
