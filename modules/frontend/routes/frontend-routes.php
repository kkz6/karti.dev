<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\FrontendController;

Route::get('/', [FrontendController::class, 'home'])->name('home');
Route::get('/articles', [FrontendController::class, 'articles'])->name('articles');
Route::get('/articles/{slug}', [FrontendController::class, 'article'])->name('article');
Route::get('/projects', [FrontendController::class, 'projects'])->name('projects');
Route::get('/photography', [FrontendController::class, 'photography'])->name('photography');
