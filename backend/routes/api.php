<?php

use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\TicketController;
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
        Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle']);
        Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', fn (Request $request) => [
            'data' => $request->user(),
        ]);

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/accept-terms', [AuthController::class, 'acceptTerms']);

        Route::apiResource('tickets', TicketController::class)
            ->only(['index', 'store', 'show'])
            ->middleware('throttle:60,1');

        Route::apiResource('appointments', AppointmentController::class)
            ->only(['index', 'store', 'show'])
            ->middleware('throttle:60,1');
    });
});