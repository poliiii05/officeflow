<?php

namespace App\Notifications;

use App\Models\TicketActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TicketReplyNotification extends Notification
{
    use Queueable;

    public function __construct(public TicketActivity $activity) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $this->activity->loadMissing(['ticket', 'user']);

        return [
            'title' => 'New staff reply',
            'message' => $this->activity->user?->name.' replied to your ticket.',
            'ticket_id' => $this->activity->ticket_id,
            'ticket_number' => $this->activity->ticket?->ticket_number,
            'ticket_subject' => $this->activity->ticket?->subject,
            'activity_id' => $this->activity->id,
        ];
    }
}