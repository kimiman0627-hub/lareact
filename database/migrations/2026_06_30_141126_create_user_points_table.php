<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 30);           // EARN / USE / EXPIRE / ADMIN_ADJUST
            $table->bigInteger('amount');          // 양수=적립, 음수=차감
            $table->unsignedBigInteger('balance'); // 처리 후 잔액
            $table->string('description')->nullable();
            $table->string('related_type', 50)->nullable();  // 연관 모델 타입 (App\Models\Board\Post 등)
            $table->unsignedBigInteger('related_id')->nullable(); // 연관 모델 ID
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_points');
    }
};
