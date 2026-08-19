<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Ticket;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureStaffAccess($request);

        $validated = $request->validate([
            'kind' => ['nullable', 'in:all,tickets,appointments'],
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $kind = $validated['kind'] ?? 'all';
        $perPage = $validated['per_page'] ?? 10;
        $search = $validated['search'] ?? null;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        $ticketBaseQuery = $this->ticketBaseQuery($search, $dateFrom, $dateTo);
        $appointmentBaseQuery = $this->appointmentBaseQuery($search, $dateFrom, $dateTo);

        $ticketTotal = (clone $ticketBaseQuery)->count();
        $appointmentTotal = (clone $appointmentBaseQuery)->count();

        $queries = [];

        if (in_array($kind, ['all', 'tickets'], true)) {
            $queries[] = (clone $ticketBaseQuery)->selectRaw(
                "'ticket' as kind, tickets.id as item_id, tickets.created_at"
            );
        }

        if (in_array($kind, ['all', 'appointments'], true)) {
            $queries[] = (clone $appointmentBaseQuery)->selectRaw(
                "'appointment' as kind, appointments.id as item_id, appointments.created_at"
            );
        }

        $recordsQuery = array_shift($queries);

        foreach ($queries as $query) {
            $recordsQuery->unionAll($query);
        }

        $records = DB::query()
            ->fromSub($recordsQuery, 'staff_records')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $ticketIds = collect($records->items())
            ->where('kind', 'ticket')
            ->pluck('item_id')
            ->all();

        $appointmentIds = collect($records->items())
            ->where('kind', 'appointment')
            ->pluck('item_id')
            ->all();

        $tickets = Ticket::query()
            ->with([
                'requester:id,name,email,requester_type',
                'assignedTo:id,name,email',
            ])
            ->whereIn('id', $ticketIds)
            ->get()
            ->keyBy('id');

        $appointments = Appointment::query()
            ->with([
                'requester:id,name,email,requester_type',
                'assignedTo:id,name,email',
            ])
            ->whereIn('id', $appointmentIds)
            ->get()
            ->keyBy('id');

        $data = collect($records->items())
            ->map(function (object $record) use ($tickets, $appointments) {
                $item = $record->kind === 'ticket'
                    ? $tickets->get($record->item_id)
                    : $appointments->get($record->item_id);

                if (! $item) {
                    return null;
                }

                return [
                    'kind' => $record->kind,
                    'item' => $item,
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
            'summary' => [
                'all' => $ticketTotal + $appointmentTotal,
                'tickets' => $ticketTotal,
                'appointments' => $appointmentTotal,
            ],
        ]);
    }

    private function ticketBaseQuery(
        ?string $search,
        ?string $dateFrom,
        ?string $dateTo
    ): Builder {
        return DB::table('tickets')
            ->join('users as requesters', 'requesters.id', '=', 'tickets.requester_id')
            ->when($search, function (Builder $query, string $value) {
                $term = '%'.$value.'%';

                $query->where(function (Builder $searchQuery) use ($term) {
                    $searchQuery
                        ->where('tickets.ticket_number', 'ilike', $term)
                        ->orWhere('tickets.subject', 'ilike', $term)
                        ->orWhere('tickets.department', 'ilike', $term)
                        ->orWhere('tickets.category', 'ilike', $term)
                        ->orWhere('requesters.name', 'ilike', $term)
                        ->orWhere('requesters.email', 'ilike', $term);
                });
            })
            ->when(
                $dateFrom,
                fn (Builder $query, string $date) => $query->whereDate('tickets.created_at', '>=', $date)
            )
            ->when(
                $dateTo,
                fn (Builder $query, string $date) => $query->whereDate('tickets.created_at', '<=', $date)
            );
    }

    private function appointmentBaseQuery(
        ?string $search,
        ?string $dateFrom,
        ?string $dateTo
    ): Builder {
        return DB::table('appointments')
            ->join('users as requesters', 'requesters.id', '=', 'appointments.requester_id')
            ->when($search, function (Builder $query, string $value) {
                $term = '%'.$value.'%';

                $query->where(function (Builder $searchQuery) use ($term) {
                    $searchQuery
                        ->where('appointments.appointment_number', 'ilike', $term)
                        ->orWhere('appointments.purpose', 'ilike', $term)
                        ->orWhere('appointments.department', 'ilike', $term)
                        ->orWhere('requesters.name', 'ilike', $term)
                        ->orWhere('requesters.email', 'ilike', $term);
                });
            })
            ->when(
                $dateFrom,
                fn (Builder $query, string $date) => $query->whereDate('appointments.created_at', '>=', $date)
            )
            ->when(
                $dateTo,
                fn (Builder $query, string $date) => $query->whereDate('appointments.created_at', '<=', $date)
            );
    }

    private function ensureStaffAccess(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['staff', 'super_admin'], true),
            403
        );
    }
}