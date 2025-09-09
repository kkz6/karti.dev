<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\PortfolioController;

Route::middleware(['web'])->group(function () {
    // Main routes matching Spotlight theme
    Route::get('/', [PortfolioController::class, 'home'])->name('home');
    Route::get('/articles', [PortfolioController::class, 'articles'])->name('articles.index');
    Route::get('/articles/{slug}', [PortfolioController::class, 'showArticle'])->name('articles.show');
    Route::get('/projects', [PortfolioController::class, 'projects'])->name('projects');
    Route::get('/photography', [PhotographyController::class, 'index'])->name('photography');
    Route::get('/photography/{slug}', [PhotographyController::class, 'show'])->name('photography.show');
    Route::post('/thank-you', [PortfolioController::class, 'thankYou'])->name('thank-you');
});
