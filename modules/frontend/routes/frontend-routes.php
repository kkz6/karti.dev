<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\FrontendController;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\ProjectsController;
use Modules\Frontend\Http\Controllers\UsesController;

Route::get('/', [FrontendController::class, 'home'])->name('home');
Route::get('/articles', [FrontendController::class, 'articles'])->name('articles');
Route::get('/articles/{slug}', [FrontendController::class, 'article'])->name('article');
Route::get('/projects', [ProjectsController::class, 'index'])->name('projects');
Route::get('/photography', [PhotographyController::class, 'index'])->name('photography');
Route::get('/photography/{slug}', [PhotographyController::class, 'show'])->name('photography.show');
Route::get('/about', [FrontendController::class, 'about'])->name('about');
Route::get('/uses', [UsesController::class, 'index'])->name('uses');
Route::get('/speaking', [FrontendController::class, 'speaking'])->name('speaking');
