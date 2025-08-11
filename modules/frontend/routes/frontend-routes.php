<?php

use Modules\Frontend\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FrontendController::class, 'home'])->name('home');
Route::get('/about', [FrontendController::class, 'about'])->name('about');
Route::get('/articles', [FrontendController::class, 'articles'])->name('articles');
Route::get('/articles/{slug}', [FrontendController::class, 'article'])->name('article');
Route::get('/projects', [FrontendController::class, 'projects'])->name('projects');
Route::get('/speaking', [FrontendController::class, 'speaking'])->name('speaking');
Route::get('/uses', [FrontendController::class, 'uses'])->name('uses');
Route::get('/photography', [FrontendController::class, 'photography'])->name('photography');
Route::get('/contact', [FrontendController::class, 'contact'])->name('contact');
Route::get('/privacy', [FrontendController::class, 'privacy'])->name('privacy');
Route::get('/terms', [FrontendController::class, 'terms'])->name('terms');
