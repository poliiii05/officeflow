<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Throwable;

class AuthController extends Controller
{
    private const KNOWN_EMAIL_PROVIDERS = [
        'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com',
        'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'icloud.com', 'me.com', 'mac.com', 'proton.me',
        'protonmail.com', 'aol.com', 'zoho.com', 'mail.com',
    ];

    private const COMMON_EMAIL_DOMAIN_TYPOS = [
        'glaim.com' => 'gmail.com',
        'glim.com' => 'gmail.com',
        'gmil.com' => 'gmail.com',
        'gmal.com' => 'gmail.com',
        'gmial.com' => 'gmail.com',
        'gmai.com' => 'gmail.com',
        'gmaill.com' => 'gmail.com',
        'gmail.con' => 'gmail.com',
        'gmail.co' => 'gmail.com',
        'yahho.com' => 'yahoo.com',
        'yaho.com' => 'yahoo.com',
        'yahoo.con' => 'yahoo.com',
        'ymial.com' => 'ymail.com',
        'hotmial.com' => 'hotmail.com',
        'hotmai.com' => 'hotmail.com',
        'outlok.com' => 'outlook.com',
        'outlook.con' => 'outlook.com',
        'iclod.com' => 'icloud.com',
        'icloud.con' => 'icloud.com',
    ];

    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'max:255',
                Rule::email()
                    ->rfcCompliant(strict: true)
                    ->validateMxRecord()
                    ->preventSpoofing(),
                function (string $attribute, mixed $value, Closure $fail): void {
                    $this->validateEmailDomain($value, $fail);
                },
                'unique:users,email',
            ],
            'password' => ['required', 'confirmed', Password::min(8)->numbers()->symbols()],
            'terms_accepted' => ['accepted'],
        ]);

        $user = User::create([
            'name' => $validated['first_name'].' '.$validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            'requester_type' => 'visitor',
            'terms_accepted_at' => now(),
            'onboarding_completed_at' => null,
        ]);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'data' => [
                'user' => $user,
            ],
            'message' => 'Account created successfully. Please check your email for verification.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc,strict'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid login credentials.',
            ], 422);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before signing in.',
            ], 403);
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
            $email = Str::lower($googleUser->getEmail());

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $email)
                ->first();

            if (! $user) {
                $user = User::create([
                    'name' => $googleUser->getName() ?: $googleUser->getNickname() ?: 'OfficeFlow User',
                    'email' => $email,
                    'email_verified_at' => now(),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'password' => Hash::make(Str::random(40)),
                    'role' => 'user',
                    'requester_type' => 'visitor',
                    'terms_accepted_at' => now(),
                    'onboarding_completed_at' => null,
                ]);
            } else {
                $user->forceFill([
                    'google_id' => $user->google_id ?: $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ])->save();
            }

            $token = $user->createToken('officeflow-web')->plainTextToken;

            $dashboardPath = match ($user->role) {
                'super_admin' => '/super-admin/dashboard',
                'staff' => '/staff/dashboard',
                default => '/dashboard',
            };

            return redirect()->away($frontendUrl.$dashboardPath.'?google_token='.urlencode($token));
       } catch (Throwable $exception) {
            report($exception);

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

    public function completeOnboarding(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'onboarding_completed_at' => $user->onboarding_completed_at ?: now(),
        ])->save();

        return response()->json([
            'data' => [
                'user' => $user->fresh(),
            ],
            'message' => 'Onboarding completed successfully.',
        ]);
    }

    private function validateEmailDomain(mixed $value, Closure $fail): void
    {
        $email = Str::lower(trim((string) $value));
        $domain = Str::after($email, '@');

        if ($domain === '' || ! str_contains($domain, '.')) {
            return;
        }

        $labels = explode('.', $domain);
        $rootLabel = $labels[0] ?? '';

        if ($rootLabel === '' || ctype_digit($rootLabel)) {
            $fail('Use a valid organization or email provider domain.');
            return;
        }

        foreach ($labels as $label) {
            if ($label === '' || str_starts_with($label, '-') || str_ends_with($label, '-')) {
                $fail('Use a valid email domain.');
                return;
            }
        }

        if (isset(self::COMMON_EMAIL_DOMAIN_TYPOS[$domain])) {
            $fail('Invalid email domain. Did you mean '.self::COMMON_EMAIL_DOMAIN_TYPOS[$domain].'?');
            return;
        }

        $suggestedDomain = $this->suggestEmailDomain($domain);

        if ($suggestedDomain !== null) {
            $fail('Invalid email domain. Did you mean '.$suggestedDomain.'?');
        }
    }

    private function suggestEmailDomain(string $domain): ?string
    {
        if (in_array($domain, self::KNOWN_EMAIL_PROVIDERS, true)) {
            return null;
        }

        $domainEnding = implode('.', array_slice(explode('.', $domain), 1));
        $closestProvider = null;
        $closestDistance = PHP_INT_MAX;

        foreach (self::KNOWN_EMAIL_PROVIDERS as $provider) {
            $providerEnding = implode('.', array_slice(explode('.', $provider), 1));

            if ($providerEnding !== $domainEnding) {
                continue;
            }

            $distance = levenshtein($domain, $provider);

            if ($distance < $closestDistance) {
                $closestDistance = $distance;
                $closestProvider = $provider;
            }
        }

        return $closestDistance <= 2 ? $closestProvider : null;
    }
}
