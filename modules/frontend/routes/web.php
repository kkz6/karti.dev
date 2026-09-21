<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\Admin\ConsultationBookingsController;
use Modules\Frontend\Http\Controllers\Admin\ContactSubmissionsController;
use Modules\Frontend\Http\Controllers\ContactController;
use Modules\Frontend\Http\Controllers\NewsletterController;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\PortfolioController;
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
    Route::get('/contact', [ContactController::class, 'create'])->name('contact');
    Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:contact')->name('contact.store');
    Route::post('/newsletter/subscribe', [NewsletterController::class, 'store'])->middleware('throttle:newsletter')->name('newsletter.subscribe');
    Route::post('/thank-you', [NewsletterController::class, 'store'])->middleware('throttle:newsletter')->name('thank-you');
    Route::match(['get', 'post'], '/newsletter/confirm/{subscriber}/{key}', [NewsletterController::class, 'confirm'])
        ->middleware(['signed', 'throttle:30,1'])->name('newsletter.confirm');
    Route::match(['get', 'post'], '/newsletter/unsubscribe/{subscriber}/{key}', [NewsletterController::class, 'unsubscribe'])
        ->middleware(['signed', 'throttle:30,1'])->name('newsletter.unsubscribe');
});

Route::middleware(['web', 'auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/newsletter', [\Modules\Frontend\Http\Controllers\Admin\NewsletterSubscribersController::class, 'index'])->name('newsletter.index');
    Route::get('/bookings', [ConsultationBookingsController::class, 'index'])->name('bookings.index');
    Route::get('/contact', [ContactSubmissionsController::class, 'index'])->name('contact.index');
    Route::get('/contact/{contactSubmission}', [ContactSubmissionsController::class, 'show'])->name('contact.show');
    Route::patch('/contact/{contactSubmission}', [ContactSubmissionsController::class, 'update'])->name('contact.update');
});
