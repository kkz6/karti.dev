<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\UsesController;
use Modules\Pages\Http\Controllers\PagesController;

Route::get('/about', [PagesController::class, 'about'])->name('about');
Route::get('/uses', [UsesController::class, 'index'])->name('uses');
Route::get('/contact', [PagesController::class, 'contact'])->name('contact');
Route::get('/speaking', [PagesController::class, 'speaking'])->name('speaking');
Route::get('/privacy', [PagesController::class, 'privacy'])->name('privacy');
Route::get('/terms', [PagesController::class, 'terms'])->name('terms');
