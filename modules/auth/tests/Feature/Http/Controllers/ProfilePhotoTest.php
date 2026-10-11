<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

test('profile photos can be uploaded replaced and removed with account avatars refreshed', function () {
    $user  = User::factory()->create();
    $other = User::factory()->create();
    $other->updateProfilePhoto(UploadedFile::fake()->image('other.jpg'));
    $otherPath  = $other->profile_photo_path;
    $verifiedAt = $user->email_verified_at;
    $this->actingAs($user)->post(route('profile.photo.update'), ['photo' => UploadedFile::fake()->image('profile.jpg'), 'user_id' => $other->id])->assertRedirect(route('profile.edit'))->assertSessionHasNoErrors();
    $firstPath = $user->fresh()->profile_photo_path;
    Storage::disk('public')->assertExists($firstPath);
    expect($user->fresh()->avatar)->toBe($user->fresh()->profile_photo_url)->and($user->fresh()->email_verified_at->toISOString())->toBe($verifiedAt->toISOString());
    $this->get(route('profile.edit'))->assertInertia(fn (Assert $page) => $page->where('hasProfilePhoto', true)->where('auth.user.avatar', $user->fresh()->avatar));
    $this->post(route('profile.photo.update'), ['photo' => UploadedFile::fake()->image('replacement.png')])->assertSessionHasNoErrors();
    $secondPath = $user->fresh()->profile_photo_path;
    expect($secondPath)->not->toBe($firstPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($secondPath);
    $this->delete(route('profile.photo.destroy'))->assertRedirect(route('profile.edit'));
    Storage::disk('public')->assertMissing($secondPath);
    expect($user->fresh()->profile_photo_path)->toBeNull()->and($user->fresh()->avatar)->toBeNull();
    Storage::disk('public')->assertExists($otherPath);
    expect($other->fresh()->profile_photo_path)->toBe($otherPath);
    $this->get(route('profile.edit'))->assertInertia(fn (Assert $page) => $page->where('hasProfilePhoto', false)->where('auth.user.avatar', null));
});

test('invalid or oversized images are rejected without replacing the current photo', function (string $type) {
    $user = User::factory()->create();
    $user->updateProfilePhoto(UploadedFile::fake()->image('original.jpg'));
    $path = $user->profile_photo_path;
    $file = match ($type) {
        'not-image' => UploadedFile::fake()->create('fake.jpg', 20, 'image/jpeg'),
        'svg'       => UploadedFile::fake()->create('image.svg', 20, 'image/svg+xml'),
        'too-large' => UploadedFile::fake()->image('large.png')->size(2049),
        'too-wide'  => UploadedFile::fake()->image('wide.png', 4097, 1),
    };
    $this->actingAs($user)->post(route('profile.photo.update'), ['photo' => $file])->assertSessionHasErrors('photo');
    expect($user->fresh()->profile_photo_path)->toBe($path);
    Storage::disk('public')->assertExists($path);
    expect(Storage::disk('public')->allFiles('profile-photos'))->toHaveCount(1);
})->with(['not-image', 'svg', 'too-large', 'too-wide']);

test('removing an absent profile photo is harmless', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->delete(route('profile.photo.destroy'))->assertRedirect(route('profile.edit'));
    expect($user->fresh()->profile_photo_path)->toBeNull();
});

test('guests cannot upload or remove profile photos', function () {
    $this->post(route('profile.photo.update'), ['photo' => UploadedFile::fake()->image('profile.png')])->assertRedirect(route('login'));
    $this->delete(route('profile.photo.destroy'))->assertRedirect(route('login'));
    expect(Storage::disk('public')->allFiles())->toBeEmpty();
});
