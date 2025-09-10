<?php

namespace Modules\Auth\DTO;

use Illuminate\Validation\Rule;
use Modules\Auth\Models\User;
use Spatie\LaravelData\Data;

class ProfileDTO extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
        ];
    }

    /**
     * Get validation rules for update operation
     */
    public static function updateRules(int $userId): array
    {
        return [
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($userId)],
        ];
    }
}
