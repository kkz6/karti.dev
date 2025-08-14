<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\MediaController;

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    // Media Manager
    Route::get('/media', [MediaController::class, 'index'])->name('media.index');

    // Media API routes
    Route::prefix('media')->name('media.')->group(function () {
        Route::get('/files', [MediaController::class, 'getFiles'])->name('files');
        Route::post('/upload', [MediaController::class, 'upload'])->name('upload');
        Route::post('/lock', [MediaController::class, 'lock'])->name('lock');
        Route::post('/visibility', [MediaController::class, 'visibility'])->name('visibility');
        Route::get('/locked-list', [MediaController::class, 'lockedList'])->name('locked_list');
    });
});
