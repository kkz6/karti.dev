<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\PortfolioController;
use Modules\Frontend\Http\Controllers\FrontendController;

Route::middleware(['web'])->group(function () {
    // Main routes matching Spotlight theme
    Route::get('/', [PortfolioController::class, 'home'])->name('home');
    Route::get('/articles', [PortfolioController::class, 'articles'])->name('articles.index');
    Route::get('/articles/{slug}', [PortfolioController::class, 'showArticle'])->name('articles.show');
    Route::get('/projects', [PortfolioController::class, 'projects'])->name('projects');
    Route::get('/photography', [PortfolioController::class, 'photography'])->name('photography');
    Route::get('/photography/{slug}', [PortfolioController::class, 'showPhotoCollection'])->name('photography.show');
    Route::post('/thank-you', [PortfolioController::class, 'thankYou'])->name('thank-you');
});
