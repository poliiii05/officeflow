<?php

use App\Http\Controllers\Api\V1\AuthController;
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

    Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', fn (Request $request) => [
            'data' => $request->user(),
        ]);

        Route::post('/auth/logout', [AuthController::class, 'logout']);
    });
});