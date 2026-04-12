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
        Schema::create('inquiries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type', 20)->default('SUPPORT');    // PARTNERSHIP | SUPPORT
            $table->unsignedBigInteger('user_id')->nullable();  // 로그인 유저면 연결
            $table->string('name', 100);
            $table->string('email', 255);
            $table->string('phone', 30)->nullable();
            $table->string('title', 200);
            $table->text('content');
            $table->string('status', 20)->default('PENDING');  // PENDING | ANSWERED | CLOSED
            $table->text('answer')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
