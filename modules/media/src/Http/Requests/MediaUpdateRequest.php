<?php

namespace Modules\Media\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUpdateRequest extends FormRequest
{
    public function authorize(): true
    {
        return true;
    }

    public function rules()
    {
        return [
            'path'    => ['string', 'nullable'],
            'rename'  => ['string', 'nullable'],
            'title'   => ['required_without:path', 'string'],
            'alt'     => ['nullable', 'string'],
            'credit'  => ['nullable', 'string'],
            'caption' => ['nullable', 'string'],
            'focus'   => ['nullable', 'string'],
        ];
    }

    public function messages()
    {
        return [
            'title.required_without' => 'A title is required',
        ];
    }
}
