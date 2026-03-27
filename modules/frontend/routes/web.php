<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\PortfolioController;
use Modules\Frontend\Http\Controllers\BookingsController;
use Modules\Frontend\Http\Controllers\ProjectsController;

Route::middleware(['web'])->group(function () {
    // Main routes matching Spotlight theme
    Route::get('/', [PortfolioController::class, 'home'])->name('home');
    Route::get('/articles', [PortfolioController::class, 'articles'])->name('articles.index');
    Route::get('/articles/{slug}', [PortfolioController::class, 'showArticle'])->name('articles.show');
    Route::get('/projects', [ProjectsController::class, 'index'])->name('projects');
    Route::get('/photography', [PhotographyController::class, 'index'])->name('photography');
    Route::get('/photography/{slug}', [PhotographyController::class, 'show'])->name('photography.show');
    Route::get('/upwork', [PortfolioController::class, 'upworkConsultation'])->name('upworkConsultation');
    Route::post('/thank-you', [PortfolioController::class, 'thankYou'])->name('thank-you');

    // Upwork booking flow
    Route::get('/upwork/slots', [BookingsController::class, 'getSlots'])->name('upwork.slots');
    Route::post('/upwork/reserve-slot', [BookingsController::class, 'reserveSlot'])->name('upwork.reserveSlot');
    Route::post('/upwork/create-payment', [BookingsController::class, 'createPayment'])->name('upwork.createPayment');
    Route::get('/upwork/booking-confirmed', [BookingsController::class, 'bookingConfirmed'])->name('upwork.bookingConfirmed');
});
