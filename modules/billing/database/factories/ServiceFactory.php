<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\Service;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return ['name' => fake()->words(3, true), 'description' => fake()->sentence(), 'unit' => 'hour', 'rate' => '1000.0000', 'currency' => 'INR'];
    }
}
