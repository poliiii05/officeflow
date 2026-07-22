<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['started_at', 'ended_at']);
        });

        DB::statement(
            'CREATE UNIQUE INDEX staff_shifts_one_active_per_user ON staff_shifts (user_id) WHERE ended_at IS NULL'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS staff_shifts_one_active_per_user');

        Schema::dropIfExists('staff_shifts');
    }
};