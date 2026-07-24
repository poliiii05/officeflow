    <?php

    use App\Http\Controllers\Api\V1\AppointmentController;
    use App\Http\Controllers\Api\V1\AuthController;
    use App\Http\Controllers\Api\V1\TicketController;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\Api\V1\StaffDashboardController;
    use App\Http\Controllers\Api\V1\TicketActivityController;
    use App\Http\Controllers\Api\V1\NotificationController;
    use App\Http\Controllers\Api\V1\AppointmentActivityController;
    use App\Http\Controllers\Api\V1\StaffShiftController;
    use App\Http\Controllers\Api\V1\SuperAdminDashboardController;
    use App\Http\Controllers\Api\V1\SuperAdminUserController;

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

            Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus'])
                ->middleware('throttle:180,1');

            Route::patch('/tickets/{ticket}/assign', [TicketController::class, 'assign'])
                ->middleware('throttle:180,1');

            Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])
                ->middleware('throttle:180,1');

            Route::patch('/appointments/{appointment}/assign', [AppointmentController::class, 'assign'])
            ->middleware('throttle:180,1');

            Route::apiResource('tickets', TicketController::class)
                ->only(['index', 'store', 'show'])
                ->middleware('throttle:180,1');

            Route::apiResource('appointments', AppointmentController::class)
                ->only(['index', 'store', 'show'])
                ->middleware('throttle:180,1');
            
            Route::get('/staff/shift/current', [StaffShiftController::class, 'current'])
                ->middleware('throttle:180,1');

            Route::post('/staff/shift/start', [StaffShiftController::class, 'start'])
                ->middleware('throttle:60,1');

            Route::post('/staff/shift/end', [StaffShiftController::class, 'end'])
                ->middleware('throttle:60,1');
            
            Route::get('/staff/overview', [StaffDashboardController::class, 'overview'])
            ->middleware('throttle:180,1');

            Route::get('/tickets/{ticket}/activities', [TicketActivityController::class, 'index'])
            ->middleware('throttle:180,1');

            Route::post('/tickets/{ticket}/activities', [TicketActivityController::class, 'store'])
            ->middleware('throttle:60,1');

            Route::get('/notifications', [NotificationController::class, 'index'])
            ->middleware('throttle:180,1');

            Route::post('/notifications/read', [NotificationController::class, 'markAllAsRead'])
            ->middleware('throttle:60,1');

            Route::get('/appointments/{appointment}/activities', [AppointmentActivityController::class, 'index'])
            ->middleware('throttle:180,1');

            Route::post('/appointments/{appointment}/activities', [AppointmentActivityController::class, 'store'])
            ->middleware('throttle:60,1');
            
            Route::get('/super-admin/overview', [SuperAdminDashboardController::class, 'overview'])
            ->middleware('throttle:180,1');

            Route::get('/super-admin/users', [SuperAdminUserController::class, 'index'])
            ->middleware('throttle:180,1');

              Route::patch('/super-admin/users/{user}/role', [SuperAdminUserController::class, 'updateRole'])
            ->middleware('throttle:60,1');
        });
    });