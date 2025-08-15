<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\MediaController;
use Modules\Media\Http\Controllers\MediaManagerController;

Route::middleware(['web', 'auth'])->prefix('admin')->group(function () {
    // Media Manager
    Route::get('media-manager', [MediaManagerController::class, 'index'])->name('media-manager');
    Route::post('media-manager/create', [MediaManagerController::class, 'create'])->name('media-manager.create');

    // Media API routes
    Route::prefix('media')->name('media.')->group(function () {
        Route::post('/upload', [MediaController::class, 'upload'])->name('upload');
        Route::post('{id}', [MediaController::class, 'show'])->name('show');
        Route::patch('{id}', [MediaController::class, 'update'])->name('update');
        Route::delete('{id}', [MediaController::class, 'destroy'])->name('destroy');
        Route::post('/image-editor/save', [MediaController::class, 'saveEditedImage'])->name('image-editor.save');
        Route::get('/{path?}', [MediaController::class, 'index'])->where('path', '.*')->name('index');
    });
});
