<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Illuminate\Foundation\Http\FormRequest;

class DeleteViewRequest extends FormRequest
{
    use ResolvesTableInstance;

    /**
     * Merge the route parameters into the request.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'table' => $this->route('table'),
            'name' => $this->route('name'),
            'state' => $this->route('state'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'table' => ['required', 'string', new Base64EncodedTableClassRule],
            'name' => ['required', 'string', 'min:1', 'max:255'],
            'state' => ['nullable', 'string'],
        ];
    }
}
