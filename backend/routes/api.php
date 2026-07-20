<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => [
        'data' => [
            'status' => 'ok',
            'service' => 'officeflow-api',
        ],
        'message' => 'OfficeFlow API is healthy.',
    ]);

    Route::get('/me', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');
});