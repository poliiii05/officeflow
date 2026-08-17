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
    use App\Http\Controllers\Api\V1\SuperAdmin\AuditLogController;
    use App\Http\Controllers\Api\V1\SuperAdmin\AnalyticsController;
    use App\Http\Controllers\Api\V1\SystemStatusController;
    use App\Http\Controllers\Api\V1\SuperAdmin\SystemSettingController;
    use App\Http\Controllers\Api\V1\AccountController;
    use App\Http\Controllers\Api\V1\StaffAnalyticsController;
    use App\Models\User;
    use Illuminate\Auth\Events\Verified;

    Route::prefix('v1')->group(function () {
        Route::get('/health', fn () => [
            'data' => [
                'status' => 'ok',
                'service' => 'officeflow-api',
            ],
            'message' => 'OfficeFlow API is healthy.',
        ]);
        
        Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
        if (! $request->hasValidSignature()) {
            abort(403);
        }

        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->away(rtrim(config('services.frontend_url'), '/').'/login?verified=1');
            })->middleware('throttle:email-verification')->name('verification.verify');


        Route::get('/system/status', [SystemStatusController::class, 'show'])
        ->middleware('throttle:180,1');

        Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:auth-register');

        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:auth-login');

        Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])
            ->middleware('throttle:auth-google');

        Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])
            ->middleware('throttle:auth-google');
       });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', fn (Request $request) => [
                'data' => $request->user(),
            ]);

            Route::get('/staff/analytics/productivity', [StaffAnalyticsController::class, 'productivity'])
            ->middleware('throttle:180,1');

            Route::post('/auth/logout', [AuthController::class, 'logout']);
            Route::post('/auth/accept-terms', [AuthController::class, 'acceptTerms']);
            Route::post('/auth/complete-onboarding', [AuthController::class, 'completeOnboarding']);

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

            Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
            ->middleware('throttle:120,1');

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

            Route::get('/super-admin/assignable-staff', [SuperAdminUserController::class, 'assignableStaff'])
            ->middleware('throttle:180,1');

            Route::patch('/super-admin/users/{user}/role', [SuperAdminUserController::class, 'updateRole'])
            ->middleware('throttle:60,1');

            Route::get('/super-admin/audit-logs', [AuditLogController::class, 'index'])
            ->middleware('throttle:180,1');

            Route::get('/super-admin/analytics', [AnalyticsController::class, 'index'])
             ->middleware('throttle:180,1');

            Route::get('/super-admin/settings', [SystemSettingController::class, 'index'])
            ->middleware('throttle:180,1');

            Route::patch('/super-admin/settings', [SystemSettingController::class, 'update'])
            ->middleware('throttle:60,1');

            Route::get('/account', [AccountController::class, 'show'])
            ->middleware('throttle:180,1');

            Route::patch('/account/profile', [AccountController::class, 'updateProfile'])
            ->middleware('throttle:60,1');

            Route::patch('/account/password', [AccountController::class, 'updatePassword'])
            ->middleware('throttle:30,1');

            Route::get('/staff/shifts', [StaffShiftController::class, 'index'])
                ->middleware('throttle:180,1');
            
        });
    });
