<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class, 'requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignIdFor(User::class, 'assigned_to_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ticket_number')->unique();
            $table->string('subject');
            $table->text('description');
            $table->string('department')->default('General Office');
            $table->string('category')->default('General Request');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['requester_id', 'status']);
            $table->index(['assigned_to_id', 'status']);
            $table->index(['department', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};