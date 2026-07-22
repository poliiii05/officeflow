<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TicketActivityCreated;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Events\UserNotificationChanged;
use App\Notifications\TicketReplyNotification;

class TicketActivityController extends Controller
{
    public function index(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureTicketAccess($request, $ticket);

        $activities = $ticket->activities()
            ->with(['user:id,name,email,role'])
            ->when($request->user()->role === 'user', fn ($query) => $query->where('is_internal', false))
            ->oldest()
            ->get();

        return response()->json([
            'data' => $activities,
        ]);
    }

    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $this->ensureTicketAccess($request, $ticket);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:3000'],
            'is_internal' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $isStaff = in_array($user->role, ['staff', 'super_admin'], true);

        $activity = TicketActivity::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'type' => $isStaff ? 'staff_reply' : 'requester_reply',
            'message' => $validated['message'],
            'is_internal' => $isStaff ? ($validated['is_internal'] ?? false) : false,
        ]);

        $activity->load(['user:id,name,email,role']);

        broadcast(new TicketActivityCreated($activity))->toOthers();

        if ($isStaff && ! $activity->is_internal && $ticket->requester_id !== $user->id) {
        $ticket->loadMissing('requester');

        $ticket->requester?->notify(new TicketReplyNotification($activity));

        broadcast(new UserNotificationChanged($ticket->requester_id))->toOthers();
    }

        return response()->json([
            'data' => $activity,
            'message' => 'Ticket activity added successfully.',
        ], 201);
    }

    private function ensureTicketAccess(Request $request, Ticket $ticket): void
    {
        $user = $request->user();

        if ($user->role === 'user' && $ticket->requester_id !== $user->id) {
            abort(403);
        }

        if (! in_array($user->role, ['user', 'staff', 'super_admin'], true)) {
            abort(403);
        }
    }
}