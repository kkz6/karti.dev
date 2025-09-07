<?php

use Illuminate\Support\Facades\Route;
use Modules\Speaking\Http\Controllers\AdminSpeakingController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('speaking', AdminSpeakingController::class);
});
