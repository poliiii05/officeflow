<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(10)
                ->by('register|'.$request->ip());
        });

        RateLimiter::for('auth-login', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return Limit::perMinute(10)
                ->by('login|'.$email.'|'.$request->ip());
        });

        RateLimiter::for('auth-google', function (Request $request) {
            return Limit::perMinute(20)
                ->by('google|'.$request->ip());
        });

        RateLimiter::for('email-verification', function (Request $request) {
            return Limit::perMinute(10)
                ->by(
                    'verification|'.
                    (string) $request->route('id').'|'.
                    $request->ip()
                );
        });
    }
}