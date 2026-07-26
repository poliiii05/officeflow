<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = [
        'actor_id',
        'module',
        'action',
        'auditable_type',
        'auditable_id',
        'description',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public static function record(
        ?User $actor,
        string $module,
        string $action,
        string $description,
        ?Model $auditable = null,
        array $metadata = [],
        ?Request $request = null
    ): self {
        return self::create([
            'actor_id' => $actor?->id,
            'module' => $module,
            'action' => $action,
            'auditable_type' => $auditable ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'description' => $description,
            'metadata' => $metadata ?: null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}