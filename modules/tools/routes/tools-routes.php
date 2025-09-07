<?php

use Illuminate\Support\Facades\Route;
use Modules\Tools\Http\Controllers\AdminToolController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('tools', AdminToolController::class);
});
