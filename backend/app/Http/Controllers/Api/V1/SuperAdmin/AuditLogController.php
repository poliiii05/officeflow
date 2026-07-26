<?php

namespace App\Http\Controllers\Api\V1\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403);
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $logs = AuditLog::query()
            ->with(['actor:id,name,email,role'])
            ->when($validated['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query
                        ->where('description', 'ilike', "%{$search}%")
                        ->orWhere('module', 'ilike', "%{$search}%")
                        ->orWhere('action', 'ilike', "%{$search}%")
                        ->orWhereHas('actor', function ($query) use ($search) {
                            $query
                                ->where('name', 'ilike', "%{$search}%")
                                ->orWhere('email', 'ilike', "%{$search}%");
                        });
                });
            })
            ->when($validated['module'] ?? null, fn ($query, string $module) => $query->where('module', $module))
            ->when($validated['action'] ?? null, fn ($query, string $action) => $query->where('action', $action))
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}