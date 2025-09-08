<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\Http\Controllers\AdminBlogController;
use Modules\Blog\Http\Controllers\CategoryController;
use Modules\Blog\Http\Controllers\TagController;

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // More specific routes first to avoid conflicts
    Route::resource('blog/categories', CategoryController::class);
    Route::resource('blog/tags', TagController::class);

    // General blog resource routes (should be last due to {blog} parameter)
    Route::resource('blog', AdminBlogController::class);
});
