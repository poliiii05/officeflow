<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $action
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('officeflow.staff');
    }

    public function broadcastAs(): string
    {
        return 'ticket.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'ticket' => [
                'id' => $this->ticket->id,
                'ticket_number' => $this->ticket->ticket_number,
                'subject' => $this->ticket->subject,
                'status' => $this->ticket->status,
                'priority' => $this->ticket->priority,
                'assigned_to_id' => $this->ticket->assigned_to_id,
                'updated_at' => $this->ticket->updated_at,
            ],
        ];
    }
}