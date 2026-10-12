<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Customer;

uses(RefreshDatabase::class);
test('billing actions expose one shared floating notification and subsequent loads do not replay it', function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $customer=Customer::factory()->create();
    $this->post(route('admin.customers.contacts.store', $customer), ['name'=>'Example', 'email'=>'example@example.test', 'is_primary'=>true, 'invoice_emails'=>true])->assertSessionHasNoErrors();
    $this->get(route('admin.customers.show', $customer))->assertInertia(fn (Assert $page) =>$page->has('notifications', 1)->where('notifications.0.message', 'Contact added.')->where('notifications.0.kind', 'success'));
    $this->get(route('admin.customers.show', $customer))->assertInertia(fn (Assert $page) =>$page->has('notifications', 0));
});
