<?php

use Illuminate\Support\Facades\Route;
use Modules\Projects\Http\Controllers\AdminProjectController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('projects', AdminProjectController::class);
});
