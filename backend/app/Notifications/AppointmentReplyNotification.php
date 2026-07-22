<?php

namespace App\Notifications;

use App\Models\AppointmentActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AppointmentReplyNotification extends Notification
{
    use Queueable;

    public function __construct(public AppointmentActivity $activity) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $this->activity->loadMissing(['appointment', 'user']);

        return [
            'title' => 'New appointment update',
            'message' => $this->activity->user?->name.' replied to your appointment.',
            'appointment_id' => $this->activity->appointment_id,
            'appointment_number' => $this->activity->appointment?->appointment_number,
            'appointment_purpose' => $this->activity->appointment?->purpose,
            'activity_id' => $this->activity->id,
        ];
    }
}