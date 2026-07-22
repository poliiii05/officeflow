<?php

namespace App\Events;

use App\Models\TicketActivity;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketActivityCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public TicketActivity $activity) {}

    public function broadcastOn(): Channel
    {
        return new Channel('officeflow.ticket.'.$this->activity->ticket_id);
    }

    public function broadcastAs(): string
    {
        return 'ticket.activity.created';
    }

    public function broadcastWith(): array
    {
        return [
            'data' => [
                'id' => $this->activity->id,
                'ticket_id' => $this->activity->ticket_id,
                'user_id' => $this->activity->user_id,
                'type' => $this->activity->type,
                'message' => $this->activity->message,
                'is_internal' => $this->activity->is_internal,
                'created_at' => $this->activity->created_at,
                'user' => $this->activity->user ? [
                    'id' => $this->activity->user->id,
                    'name' => $this->activity->user->name,
                    'email' => $this->activity->user->email,
                    'role' => $this->activity->user->role,
                ] : null,
            ],
        ];
    }
}