<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Appointment $appointment,
        public string $action
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('officeflow.staff');
    }

    public function broadcastAs(): string
    {
        return 'appointment.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'appointment' => [
                'id' => $this->appointment->id,
                'appointment_number' => $this->appointment->appointment_number,
                'purpose' => $this->appointment->purpose,
                'status' => $this->appointment->status,
                'assigned_to_id' => $this->appointment->assigned_to_id,
                'updated_at' => $this->appointment->updated_at,
            ],
        ];
    }
}