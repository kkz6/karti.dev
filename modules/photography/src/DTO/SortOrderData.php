<?php

declare(strict_types=1);

namespace Modules\Photography\DTO;

use Spatie\LaravelData\Data;

class SortOrderData extends Data
{
    public function __construct(
        public array $photos,
    ) {}

    public static function rules(): array
    {
        return [
            'photos' => ['required', 'array'],
            'photos.*.id' => ['required', 'exists:photos,id'],
            'photos.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    public function validationMessages(): array
    {
        return [
            'photos.required' => 'Photo data is required.',
            'photos.*.id.required' => 'Photo ID is required.',
            'photos.*.id.exists' => 'Invalid photo ID.',
            'photos.*.sort_order.required' => 'Sort order is required.',
            'photos.*.sort_order.integer' => 'Sort order must be a number.',
            'photos.*.sort_order.min' => 'Sort order cannot be negative.',
        ];
    }
}
