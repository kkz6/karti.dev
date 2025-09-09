<?php

use Illuminate\Support\Facades\Route;
use Modules\Frontend\Http\Controllers\FrontendController;
use Modules\Frontend\Http\Controllers\PhotographyController;
use Modules\Frontend\Http\Controllers\ProjectsController;

Route::get('/', [FrontendController::class, 'home'])->name('home');
Route::get('/articles', [FrontendController::class, 'articles'])->name('articles');
Route::get('/articles/{slug}', [FrontendController::class, 'article'])->name('article');
Route::get('/projects', [ProjectsController::class, 'index'])->name('projects');
Route::get('/photography', [PhotographyController::class, 'index'])->name('photography');
Route::get('/photography/{slug}', [PhotographyController::class, 'show'])->name('photography.show');
