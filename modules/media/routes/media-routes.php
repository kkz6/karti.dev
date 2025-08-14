<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\MediaController;
use Modules\Media\Http\Controllers\MediaManagerController;

Route::middleware(['web','auth'])->prefix('admin')->name('admin.')->group(function () {
    // Media Manager
    Route::get('media-manager', MediaManagerController::class)->name('media-manager');

    // Media API routes
    Route::prefix('media')->name('media.')->group(function () {
        Route::get('/', [MediaController::class, 'index'])->name('index');
        Route::post('create', [MediaController::class, 'create'])->name('create');
        Route::get('/config', [MediaController::class, 'config'])->name('config');
    });
});
