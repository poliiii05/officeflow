<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class SystemSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        return response()->json([
            'data' => SystemSetting::allSettings(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'maintenance_mode' => ['required', 'boolean'],
            'office_name' => ['required', 'string', 'max:120'],
            'support_email' => ['required', 'email', 'max:255'],
            'timezone' => ['required', 'string', 'timezone'],
            'office_note' => ['required', 'string', 'max:500'],
            'allow_user_cancellation' => ['required', 'boolean'],
            'cancellation_window' => ['required', Rule::in(['before_claim', 'before_resolution', 'disabled'])],
            'appointment_lead_days' => ['required', 'integer', 'min:0', 'max:30'],
            'default_ticket_priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'staff_shift_required' => ['required', 'boolean'],
            'audit_log_retention' => ['required', Rule::in(['90', '180', '365'])],
        ]);

        $before = SystemSetting::allSettings();

        SystemSetting::putMany($validated);

        $after = SystemSetting::allSettings();

        $changedKeys = collect($validated)
            ->filter(fn ($value, $key) => $before[$key] !== $after[$key])
            ->keys()
            ->values()
            ->all();

        if ($changedKeys) {
            $maintenanceChanged = in_array('maintenance_mode', $changedKeys, true);

            AuditLog::record(
                $request->user(),
                'settings',
                $maintenanceChanged ? 'maintenance_updated' : 'updated',
                $maintenanceChanged
                    ? ($after['maintenance_mode'] ? 'Maintenance mode was turned on.' : 'Maintenance mode was turned off.')
                    : 'System settings were updated.',
                null,
                [
                    'changed_keys' => $changedKeys,
                    'before' => Arr::only($before, $changedKeys),
                    'after' => Arr::only($after, $changedKeys),
                ],
                $request
            );
        }

        return response()->json([
            'data' => $after,
            'message' => 'System settings updated successfully.',
        ]);
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'super_admin', 403);
    }
}