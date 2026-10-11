<?php

namespace Modules\Billing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        return ['customer_id' => Customer::factory(), 'name' => fake()->name(), 'email' => fake()->safeEmail(), 'invoice_emails' => true];
    }
}
