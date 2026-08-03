<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\UserNotificationChanged;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'filter' => ['nullable', 'in:all,unread'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $notifications = $request->user()
            ->notifications()
            ->when(
                ($validated['filter'] ?? 'all') === 'unread',
                fn ($query) => $query->whereNull('read_at')
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, string $notification): JsonResponse
    {
        $notificationRecord = $request->user()
            ->notifications()
            ->whereKey($notification)
            ->firstOrFail();

        $notificationRecord->markAsRead();

        broadcast(new UserNotificationChanged($request->user()->id))->toOthers();

        return response()->json([
            'data' => $notificationRecord->fresh(),
            'message' => 'Notification marked as read.',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update([
            'read_at' => now(),
        ]);

        broadcast(new UserNotificationChanged($request->user()->id))->toOthers();

        return response()->json([
            'message' => 'Notifications marked as read.',
        ]);
    }
}
