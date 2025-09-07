<?php

use Illuminate\Support\Facades\Route;
use Modules\Photography\Http\Controllers\AdminPhotographyController;
use Modules\Photography\Http\Controllers\AdminPhotoController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Photography Collections resource routes
    Route::resource('photography', AdminPhotographyController::class);

    // Photos nested resource routes
    Route::resource('photography.photos', AdminPhotoController::class)->except(['show']);
    Route::patch('photography/{photoCollection}/photos/sort-order', [AdminPhotoController::class, 'updateSortOrder'])
        ->name('photography.photos.sort-order');
});
