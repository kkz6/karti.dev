<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Media\Rules\FileArray;

class MediaStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'file'    => ['required', new FileArray],
            'title'   => ['sometimes', 'string'],
            'alt'     => ['sometimes', 'string'],
            'caption' => ['sometimes', 'string'],
            'credit'  => ['sometimes', 'string'],
        ];
    }
}
