<?php

use Illuminate\Support\Facades\Route;
use Modules\Tools\Http\Controllers\AdminToolController;
use Modules\Tools\Http\Controllers\ToolCategoryController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('tool-categories', [ToolCategoryController::class, 'store'])->name('tool-categories.store');
    Route::resource('tools', AdminToolController::class);
});
