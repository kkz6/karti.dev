<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\MediaController;
use Modules\Media\Http\Controllers\MediaManagerController;

Route::middleware(['web', 'auth'])->prefix('admin')->group(function () {
    // Media Manager
    Route::get('media-manager', [MediaManagerController::class, 'index'])->name('media-manager');
    Route::post('media-manager/create', [MediaManagerController::class, 'create'])->name('media-manager.create');
    Route::delete('media-manager/folder', [MediaManagerController::class, 'destroy'])->name('media-manager.destroy');

    // Media API routes
    Route::prefix('media')->name('media.')->group(function () {
        Route::post('/', [MediaController::class, 'create'])->name('create');
        Route::post('/move', [MediaController::class, 'move'])->name('move');
        Route::get('/show/{id?}', [MediaController::class, 'show'])->name('show');
        Route::patch('{id}', [MediaController::class, 'update'])->name('update');
        Route::delete('{id}', [MediaController::class, 'destroy'])->name('destroy');
        Route::get('{id}/download', [MediaController::class, 'download'])->where('id', '[0-9]+')->name('download');
        Route::post('/image-editor/save', [MediaController::class, 'saveEditedImage'])->name('image-editor.save');
        Route::get('/{path?}', [MediaController::class, 'index'])->where('path', '.*')->name('index');
    });
});
