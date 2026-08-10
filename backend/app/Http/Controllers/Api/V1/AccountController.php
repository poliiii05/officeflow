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
            // Unicode-aware (u modifier + \p{L}/\p{N}) so names with
            // diacritics (Niño, José, etc.) match the frontend's
            // \p{L} regex instead of being silently rejected here.
            'nickname' => ['nullable', 'string', 'max:80', 'regex:/^[\p{L}\p{N} ._-]+$/u'],
        ], [], [
            // UI calls this field "Display name" — keep Laravel's default
            // validation error text ("The nickname field...") in sync so a
            // 422 response doesn't say "nickname" while the form says
            // "Display name".
            'nickname' => 'display name',
        ]);

        $user = $request->user();

        $user->forceFill([
            'name' => trim($validated['name']),
            'nickname' => isset($validated['nickname']) && trim($validated['nickname']) !== ''
                ? trim($validated['nickname'])
                : null,
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