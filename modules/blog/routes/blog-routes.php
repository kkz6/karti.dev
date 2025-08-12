<?php

use Illuminate\Support\Facades\Route;
use Modules\Blog\Http\Controllers\AdminBlogController;
use Modules\Blog\Http\Controllers\AdminCategoryController;
use Modules\Blog\Http\Controllers\AdminTagController;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Blog resource routes
    Route::resource('blog', AdminBlogController::class)->names([
        'index' => 'blog.index',
        'create' => 'blog.create',
        'store' => 'blog.store',
        'show' => 'blog.show',
        'edit' => 'blog.edit',
        'update' => 'blog.update',
        'destroy' => 'blog.destroy',
    ]);

    // Additional bulk action route
    Route::post('blog/bulk-action', [AdminBlogController::class, 'bulkAction'])
        ->name('blog.bulk-action');

    // Categories resource routes
    Route::resource('blog/categories', AdminCategoryController::class)->names([
        'index' => 'blog.categories.index',
        'create' => 'blog.categories.create',
        'store' => 'blog.categories.store',
        'show' => 'blog.categories.show',
        'edit' => 'blog.categories.edit',
        'update' => 'blog.categories.update',
        'destroy' => 'blog.categories.destroy',
    ]);

    // Tags resource routes
    Route::resource('blog/tags', AdminTagController::class)->names([
        'index' => 'blog.tags.index',
        'create' => 'blog.tags.create',
        'store' => 'blog.tags.store',
        'show' => 'blog.tags.show',
        'edit' => 'blog.tags.edit',
        'update' => 'blog.tags.update',
        'destroy' => 'blog.tags.destroy',
    ]);
});
