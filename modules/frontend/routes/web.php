<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\PortfolioController;
use Modules\Frontend\Http\Controllers\Admin\ConsultationBookingsController;
use Modules\Frontend\Http\Controllers\ProjectsController;

Route::middleware(['web'])->group(function () {
    // Main routes matching Spotlight theme
    Route::get('/', [PortfolioController::class, 'home'])->name('home');
    Route::get('/articles', [PortfolioController::class, 'articles'])->name('articles.index');
    Route::get('/articles/{slug}', [PortfolioController::class, 'showArticle'])->name('articles.show');
    Route::get('/projects', [ProjectsController::class, 'index'])->name('projects');
    Route::get('/photography', [PhotographyController::class, 'index'])->name('photography');
    Route::get('/photography/{slug}', [PhotographyController::class, 'show'])->name('photography.show');
    Route::get('/consulting', [PortfolioController::class, 'consulting'])->name('consulting');
    Route::post('/thank-you', [PortfolioController::class, 'thankYou'])->name('thank-you');
});

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/bookings', [ConsultationBookingsController::class, 'index'])->name('bookings.index');
});
