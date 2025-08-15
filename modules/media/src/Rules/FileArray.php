<?php

namespace Modules\Media\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileArray implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $areFiles = true;

        if (is_array($value)) {
            foreach ($value as $item) {
                $areFiles = $areFiles && ($item instanceof UploadedFile && $item->isValid());
            }
        }

        if (!$areFiles) {
            $fail('You must upload a file or collection of files.');
        }
    }
}
