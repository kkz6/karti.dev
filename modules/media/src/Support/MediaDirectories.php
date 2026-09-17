<?php

namespace Modules\Media\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MediaDirectories
{
    public function validate(string $disk, string $path): string
    {
        $path = trim($path, '/');
        if (preg_match('/[\\\\\x00-\x1F]/', $path)
            || array_intersect(explode('/', $path), ['.', '..'])
            || explode('/', $path)[0] === 'conversions') {
            throw ValidationException::withMessages(['destination' => 'Choose a folder inside the media library.']);
        }
        if ($path !== '' && ! Storage::disk($disk)->directoryExists($path)) {
            throw ValidationException::withMessages(['destination' => 'This folder no longer exists. Choose another folder.']);
        }

        return $path;
    }
}
