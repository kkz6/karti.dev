<?php

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Http\Controllers\DashboardController;
use Modules\Analytics\Http\Controllers\SeoAnalyticsController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('admin/seo', [SeoAnalyticsController::class, 'index'])->name('admin.seo.index');
    Route::get('admin/seo/google', [SeoAnalyticsController::class, 'google'])->name('admin.seo.google');
    Route::get('admin/seo/page', [SeoAnalyticsController::class, 'page'])->name('admin.seo.page');
    Route::get('admin/seo/content/{type}/{id}', [SeoAnalyticsController::class, 'content'])->whereIn('type', ['article', 'gallery'])->whereNumber('id')->name('admin.seo.content');
});
