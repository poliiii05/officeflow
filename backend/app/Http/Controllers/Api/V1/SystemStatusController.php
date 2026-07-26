<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;

class SystemStatusController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = SystemSetting::allSettings();

        return response()->json([
            'data' => [
                'maintenance_mode' => $settings['maintenance_mode'],
                'office_name' => $settings['office_name'],
                'support_email' => $settings['support_email'],
                'timezone' => $settings['timezone'],
                'office_note' => $settings['office_note'],
            ],
        ]);
    }
}