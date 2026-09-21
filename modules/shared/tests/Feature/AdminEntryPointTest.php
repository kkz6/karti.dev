<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;

uses(RefreshDatabase::class);

test('the admin entry point redirects an expired session to login', function () {
    $this->withSession([
        auth('web')->getName() => PHP_INT_MAX,
    ])->get('/admin')->assertRedirect(route('login'));
});

test('the admin entry point redirects an authenticated user to the dashboard', function () {
    $this->actingAs(User::factory()->create())
        ->get('/admin')
        ->assertRedirect(route('dashboard'));
});
