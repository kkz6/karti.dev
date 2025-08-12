<?php

use Modules\Pages\Http\Controllers\PagesController;

Route::get('/about', [PagesController::class, 'about'])->name('about');
Route::get('/uses', [PagesController::class, 'uses'])->name('uses');
Route::get('/contact', [PagesController::class, 'contact'])->name('contact');
Route::get('/speaking', [PagesController::class, 'speaking'])->name('speaking');
Route::get('/privacy', [PagesController::class, 'privacy'])->name('privacy');
Route::get('/terms', [PagesController::class, 'terms'])->name('terms');
