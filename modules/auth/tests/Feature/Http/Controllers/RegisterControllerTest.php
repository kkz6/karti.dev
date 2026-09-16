<?php

use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

test('public registration routes remain disabled', function () {
    expect(Route::has('register'))->toBeFalse();
    expect(Route::has('register.store'))->toBeFalse();
    $this->get('/register')->assertNotFound();
});

test('public registration cannot create an account', function () {
    Event::fake([Registered::class]);

    $this->post('/register', [
        'name'                  => 'Test User',
        'email'                 => 'test@example.com',
        'password'              => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    $this->assertGuest();
    $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    Event::assertNotDispatched(Registered::class);
});
