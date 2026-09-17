<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Modules\Media\Rules\FileArray;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class MediaStoreRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        // Non-browser callers can omit the disk and use the same configured default.
        if (! $this->has('disk')) {
            $this->merge(['disk' => config('mediable.default_disk')]);
        }
    }

    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'file'    => ['required', new FileArray],
            'disk'    => ['required', 'string', \Illuminate\Validation\Rule::in(config('mediable.allowed_disks', ['public']))],
            'path'    => ['nullable', 'string'],
            'title'   => ['sometimes', 'string'],
            'alt'     => ['sometimes', 'string'],
            'caption' => ['sometimes', 'string'],
            'credit'  => ['sometimes', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        $uploadError = $this->firstUploadError($this->allFiles()) ?? $this->firstUploadError($_FILES['file']['error'] ?? null);

        if ($uploadError !== null) {
            $message = $this->uploadErrorMessage($uploadError);

            throw new HttpResponseException(response()->json([
                'message' => $message,
                'errors'  => ['file' => [$message]],
            ], in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 422));
        }

        parent::failedValidation($validator);
    }

    private function firstUploadError(mixed $files): ?int
    {
        if ($files instanceof UploadedFile) {
            return $files->isValid() ? null : $files->getError();
        }

        if (is_array($files)) {
            foreach ($files as $file) {
                $error = $this->firstUploadError($file);

                if ($error !== null) {
                    return $error;
                }
            }
        }

        if (is_int($files) && $files !== UPLOAD_ERR_OK) {
            return $files;
        }

        return null;
    }

    private function uploadErrorMessage(int $error): string
    {
        return match ($error) {
            UPLOAD_ERR_INI_SIZE   => sprintf('This file exceeds the server upload limit of %s.', ini_get('upload_max_filesize')),
            UPLOAD_ERR_FORM_SIZE  => 'This file exceeds the form upload limit.',
            UPLOAD_ERR_PARTIAL    => 'The file was only partially uploaded. Please try again.',
            UPLOAD_ERR_NO_FILE    => 'No file was received.',
            UPLOAD_ERR_NO_TMP_DIR => 'The server is missing a temporary upload directory.',
            UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded file.',
            UPLOAD_ERR_EXTENSION  => 'A server extension stopped the file upload.',
            default               => "The upload failed with error code {$error}.",
        };
    }
}
