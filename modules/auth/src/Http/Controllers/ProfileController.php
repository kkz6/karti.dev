<?php

namespace Modules\Auth\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('auth::settings/profile', [
            'mustVerifyEmail'                 => $user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail,
            'status'                          => session('status'),
            'hasProfilePhoto'                 => filled($user->profile_photo_path),
            'confirmsTwoFactorAuthentication' => $user->two_factor_secret && ! $user->two_factor_confirmed_at,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
        ]);

        $request->user()->fill($request->only('name', 'email'));

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profile updated.');
    }

    public function updatePhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=4096,max_height=4096'],
        ]);
        $request->user()->updateProfilePhoto($request->file('photo'));

        return Redirect::route('profile.edit')->with('success', 'Profile image updated.');
    }

    public function destroyPhoto(Request $request): RedirectResponse
    {
        $request->user()->deleteProfilePhoto();

        return Redirect::route('profile.edit')->with('success', 'Profile image removed.');
    }
}
