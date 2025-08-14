<?php

namespace Modules\Media\Helpers;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;
use Symfony\Component\Mime\MimeTypes;

class File
{
    /**
     * Get the directory name of path, trimming unnecessary `.` and `/` characters.
     */
    public static function cleanDirname(string $path): string
    {
        $dirname = pathinfo($path, PATHINFO_DIRNAME);
        if ($dirname == '.') {
            return '';
        }

        return trim($dirname, '/');
    }

    /**
     * Remove any disallowed characters from a directory value.
     */
    public static function sanitizePath(string $path, ?string $language = null): string
    {
        $language = $language ?: App::currentLocale();

        return trim(
            preg_replace(
                '/[^a-zA-Z0-9-_\/.%]+/',
                '-',
                Str::ascii($path, $language)
            ),
            DIRECTORY_SEPARATOR.'-'
        );
    }

    /**
     * Remove any disallowed characters from a filename.
     */
    public static function sanitizeFileName(string $file, ?string $language = null): string
    {
        $language = $language ?: App::currentLocale();

        return trim(
            preg_replace(
                '/[^a-zA-Z0-9\-_.%]+/',
                '-',
                Str::ascii($file, $language)
            ),
            '-'
        );
    }

    /**
     * Generate a human-readable byte count string.
     */
    public static function readableSize(int $bytes, int $precision = 1): string
    {
        static $units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        if ($bytes === 0) {
            return '0 '.$units[0];
        }
        $exponent = (int) floor(log($bytes, 1024));
        $value    = $bytes / pow(1024, $exponent);

        return round($value, $precision).' '.$units[$exponent];
    }

    /**
     * Returns the extension based on the mime type.
     *
     * If the mime type is unknown, returns null.
     *
     * @return string|null The guessed extension or null if it cannot be guessed
     *
     * @see MimeTypes
     */
    public static function guessExtension(string $mimeType): ?string
    {
        return MimeTypes::getDefault()->getExtensions($mimeType)[0] ?? null;
    }

    public static function joinPathComponents(string ...$components): string
    {
        $path = '';
        foreach ($components as $component) {
            if (empty($component)) {
                continue;
            }
            if (empty($path)) {
                $path = $component;

                continue;
            }
            $path = rtrim($path, '/').'/'.ltrim($component, '/');
        }

        return $path;
    }
}
