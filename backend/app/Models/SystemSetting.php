<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public const DEFAULTS = [
        'maintenance_mode' => false,
        'office_name' => 'OfficeFlow Service Desk',
        'support_email' => 'hello@example.com',
        'timezone' => 'Asia/Manila',
        'office_note' => 'Centralized appointment and ticketing workspace for office requests.',
        'allow_user_cancellation' => true,
        'cancellation_window' => 'before_claim',
        'appointment_lead_days' => 1,
        'default_ticket_priority' => 'medium',
        'staff_shift_required' => true,
        'audit_log_retention' => '180',
    ];

    public static function allSettings(): array
    {
        $stored = self::query()
            ->get()
            ->mapWithKeys(fn (self $setting) => [
                $setting->key => $setting->value['value'] ?? null,
            ])
            ->all();

        return array_merge(self::DEFAULTS, $stored);
    }

    public static function putValue(string $key, mixed $value): self
    {
        return self::query()->updateOrCreate(
            ['key' => $key],
            ['value' => ['value' => $value]]
        );
    }

    public static function putMany(array $settings): void
    {
        foreach ($settings as $key => $value) {
            self::putValue($key, $value);
        }
    }
}