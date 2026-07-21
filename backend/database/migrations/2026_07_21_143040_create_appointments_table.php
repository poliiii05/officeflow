<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class, 'requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'assigned_to_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('appointment_number')->unique();
            $table->string('purpose');
            $table->text('notes')->nullable();
            $table->string('department')->default('General Office');
            $table->timestamp('scheduled_at');
            $table->string('status')->default('pending');
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['requester_id', 'status']);
            $table->index(['assigned_to_id', 'status']);
            $table->index(['department', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};