<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Media\Support\ResponsiveImages;
use Modules\Settings\Settings\MediaSettings;

class UpdateMediaSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'presets'           => ['required', 'array', 'min:3', 'max:12'],
            'presets.*'         => ['required', 'array:name,width,height,fit,format,quality'],
            'presets.*.name'    => ['required', 'string', 'max:40', 'regex:/^[a-z][a-z0-9_-]*$/', 'distinct', Rule::notIn(['original'])],
            'presets.*.width'   => ['required', 'integer', 'min:32', 'max:2560'],
            'presets.*.height'  => ['nullable', 'integer', 'min:32', 'max:2560'],
            'presets.*.fit'     => ['required', Rule::in(['contain', 'cover'])],
            'presets.*.format'  => ['required', Rule::in(['webp', 'jpg', 'png'])],
            'presets.*.quality' => ['required', 'integer', 'min:40', 'max:95'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            $presets = $this->input('presets', []);
            if (! is_array($presets)) {
                return;
            }
            if (array_diff(['thumb', 'card', 'content'], array_filter(array_column($presets, 'name'), 'is_string'))) {
                $validator->errors()->add('presets', 'Keep the thumb, card and content sizes used by the admin and website.');
            }
            $builtInNames = array_column(MediaSettings::defaultPresets(), 'name');
            $current      = collect(app(ResponsiveImages::class)->presets())->keyBy('name');
            foreach ($presets as $index => $preset) {
                if (! is_array($preset)) {
                    continue;
                }
                $name = $preset['name'] ?? null;
                if (is_string($name) && in_array($name, $builtInNames, true) && $preset != $current->get($name)) {
                    $validator->errors()->add("presets.$index.name", 'Built-in image sizes are read-only. Add a custom size instead.');
                }
                if (($preset['fit'] ?? '') === 'cover' && empty($preset['height'])) {
                    $validator->errors()->add("presets.$index.height", 'A crop needs both width and height.');
                }
                if (($preset['name'] ?? '') === 'thumb' && ($preset['width'] ?? 0) > 640) {
                    $validator->errors()->add("presets.$index.width", 'Keep admin thumbnails at 640 pixels or smaller.');
                }
            }
        }];
    }

    public function attributes(): array
    {
        return [
            'presets.*.name'    => 'size name',
            'presets.*.width'   => 'width',
            'presets.*.height'  => 'height',
            'presets.*.quality' => 'quality',
        ];
    }

    public function messages(): array
    {
        return [
            'presets.*.name.distinct' => 'This name is already in use. Choose a different size name.',
            'presets.*.name.regex'    => 'Start with a lowercase letter and use only lowercase letters, numbers, hyphens or underscores.',
            'presets.*.name.not_in'   => 'Original is reserved. Choose a different size name.',
        ];
    }
}
