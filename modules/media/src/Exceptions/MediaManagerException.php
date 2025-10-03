<?php
declare(strict_types=1);

namespace Modules\Media\Exceptions;

use Exception;

class MediaManagerException extends Exception
{

    public static function diskNotAllowed($disk)
    {
        return new static("You do not have permission to access the filesystem disk `{$disk}`. Verify your configurations for admin.media.allowed_disks.");
    }

    public static function diskNotFound($disk)
    {
        return new static("Cannot find a filesystem disk named `{$disk}`");
    }

    public static function directoryNotFound($path)
    {
        return new static("Cannot find a directory `{$path}`");
    }

    public static function directoryAlreadyExists($path)
    {
        return new static("Cannot create directory `{$path}` as another file or directory by that name already exists.");
    }

    public static function fileNotFound($disk, $path)
    {
        return new static("Cannot find a file `{$disk}://{$path}`");
    }

    public static function cannotMoveDirectoryToDestination($path, $destination): static
    {
        return new static("Cannot move directory `{$path}` to `{$destination}`");
    }
}
