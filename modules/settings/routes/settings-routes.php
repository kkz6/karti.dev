<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\MediaSettingsController;
use Modules\Settings\Http\Controllers\SiteSettingsController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin/settings')->name('admin.settings.')->group(function () {
    Route::get('/', [SiteSettingsController::class, 'edit'])->name('edit');
    Route::put('/', [SiteSettingsController::class, 'update'])->name('update');
    Route::get('/media', [MediaSettingsController::class, 'edit'])->name('media.edit');
    Route::put('/media', [MediaSettingsController::class, 'update'])->name('media.update');
    Route::post('/media/rebuild', [MediaSettingsController::class, 'rebuild'])->middleware('throttle:2,1')->name('media.rebuild');
});

// Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
// Route::get('/settings/create', [SettingsController::class, 'create'])->name('settings.create');
// Route::post('/settings', [SettingsController::class, 'store'])->name('settings.store');
// Route::get('/settings/{setting}', [SettingsController::class, 'show'])->name('settings.show');
// Route::get('/settings/{setting}/edit', [SettingsController::class, 'edit'])->name('settings.edit');
// Route::put('/settings/{setting}', [SettingsController::class, 'update'])->name('settings.update');
// Route::delete('/settings/{setting}', [SettingsController::class, 'destroy'])->name('settings.destroy');
