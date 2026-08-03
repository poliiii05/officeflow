<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->fresh(),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'name' => trim($validated['name']),
        ])->save();

        return response()->json([
            'data' => $user->fresh(),
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->google_id) {
            return response()->json([
                'message' => 'Password changes are managed through your Google account.',
            ], 422);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'confirmed',
                'different:current_password',
                Password::min(8)->numbers()->symbols(),
            ],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect.',
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}
