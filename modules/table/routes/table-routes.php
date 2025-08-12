<?php

use Illuminate\Routing\Middleware\ValidateSignature;
use Illuminate\Support\Facades\Route;
use Modules\Table\Http\ActionController;
use Modules\Table\Http\ExportController;

Route::name('inertia-tables.')->prefix('/_inertia-tables/{table}/{name}')->group(function () {
    Route::post('/action/{action}/{state?}', ActionController::class)
        ->middleware(ValidateSignature::absolute())
        ->name('action');

    Route::get('/export/{export}/{state?}', ExportController::class)
        ->middleware(ValidateSignature::absolute('keys'))
        ->name('export');

    Route::post('/async-export/{export}/{state?}', ExportController::class)
        ->middleware(ValidateSignature::absolute('keys'))
        ->name('async-export');
});
