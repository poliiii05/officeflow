<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;
use Throwable;
use Laravel\Socialite\Two\AbstractProvider;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->numbers()->symbols()],
            'requester_type' => ['required', 'in:employee,visitor'],
            'terms_accepted' => ['accepted'],
        ]);

        $user = User::create([
            'name' => $validated['first_name'].' '.$validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'requester_type' => $validated['requester_type'],
            'terms_accepted_at' => now(),
        ]);

        $token = $user->createToken('officeflow-web')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
            'message' => 'Account created successfully.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid login credentials.',
            ], 422);
        }

        $token = $user->createToken('officeflow-web')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'Bearer',
            ],
            'message' => 'Logged in successfully.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

   public function redirectToGoogle(): RedirectResponse
{
    /** @var AbstractProvider $googleProvider */
    $googleProvider = Socialite::driver('google');

    return $googleProvider->stateless()->redirect();
}

   public function handleGoogleCallback(): RedirectResponse
{
    $frontendUrl = rtrim(config('services.frontend_url'), '/');

    try {
        /** @var AbstractProvider $googleProvider */
        $googleProvider = Socialite::driver('google');

        $googleUser = $googleProvider->stateless()->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if (! $user) {
                $user = User::create([
                    'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'OfficeFlow User',
                    'email' => $googleUser->getEmail(),
                    'email_verified_at' => now(),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(40)),
                    'role' => 'user',
                    'requester_type' => 'visitor',
                    'terms_accepted_at' => now(),
                ]);
            } else {
                $user->forceFill([
                    'google_id' => $user->google_id ?: $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ])->save();
            }

        $token = $user->createToken('officeflow-web')->plainTextToken;
        $needsTerms = $user->terms_accepted_at ? '0' : '1';

           return redirect()->away(
            $frontendUrl.'/dashboard?google_token='.urlencode($token)
        );
        } catch (Throwable) {
            return redirect()->away($frontendUrl.'/login?google_error=failed');
        }
    }

    public function acceptTerms(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'terms_accepted_at' => $user->terms_accepted_at ?: now(),
        ])->save();

        return response()->json([
            'data' => [
                'user' => $user->fresh(),
            ],
            'message' => 'Terms accepted successfully.',
        ]);
    }
}