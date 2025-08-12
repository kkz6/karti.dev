<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\Http\Controllers\AdminBlogController;
use Modules\Blog\Http\Controllers\AdminCategoryController;
use Modules\Blog\Http\Controllers\AdminTagController;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Blog resource routes
    Route::resource('blog/categories', AdminCategoryController::class);
    Route::resource('blog', AdminBlogController::class);

    // Additional bulk action route
    Route::post('blog/bulk-action', [AdminBlogController::class, 'bulkAction'])
        ->name('blog.bulk-action');

    // Categories resource routes

    // Tags resource routes
    Route::resource('blog/tags', AdminTagController::class);
});
