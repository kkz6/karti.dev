<?php

use Illuminate\Support\Facades\Route;
use Modules\Photography\Http\Controllers\PhotographyController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Photography (Photos) resource routes
    Route::resource('photography', PhotographyController::class);
});
