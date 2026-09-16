<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // Only local absolute paths or HTTP(S) URLs are allowed for images, never data/script URLs.
        $image = ['nullable', 'string', 'max:2048', 'regex:~^(?:/(?!/)[^\s\\\\]*|https?://[^\s]+)$~i'];

        return [
            'name'         => ['required', 'string', 'max:100'],
            'title'        => ['required', 'string', 'max:160'],
            'description'  => ['nullable', 'string', 'max:500'],
            'author'       => ['required', 'string', 'max:100'],
            'favicon'      => ['required', ...array_slice($image, 1)],
            'image'        => $image,
            'twitter_site' => ['nullable', 'string', 'regex:/^@[A-Za-z0-9_]{1,15}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'favicon.regex'      => 'Use a path such as /favicon.ico or an https:// image URL.',
            'image.regex'        => 'Use a local image path or an https:// image URL.',
            'twitter_site.regex' => 'Enter a handle such as @ikkarti, or leave it empty.',
        ];
    }
}
