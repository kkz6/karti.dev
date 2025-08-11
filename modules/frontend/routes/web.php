<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\PortfolioController;
use Modules\Frontend\Http\Controllers\FrontendController;

Route::middleware(['web'])->group(function () {
    // Main routes matching Spotlight theme
    Route::get('/', [PortfolioController::class, 'home'])->name('home');
    Route::get('/about', [PortfolioController::class, 'about'])->name('about');
    Route::get('/articles', [PortfolioController::class, 'articles'])->name('articles.index');
    Route::get('/articles/{slug}', [PortfolioController::class, 'showArticle'])->name('articles.show');
    Route::get('/projects', [PortfolioController::class, 'projects'])->name('projects');
    Route::get('/speaking', [PortfolioController::class, 'speaking'])->name('speaking');
    Route::get('/uses', [PortfolioController::class, 'uses'])->name('uses');
    Route::get('/photography', [FrontendController::class, 'photography'])->name('photography');
    Route::get('/photography/{slug}', [FrontendController::class, 'photographyShow'])->name('photography.show');
    Route::post('/thank-you', [PortfolioController::class, 'thankYou'])->name('thank-you');
});