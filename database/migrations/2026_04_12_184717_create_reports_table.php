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
        Schema::create('reports', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('user_id')->nullable(); // 비로그인도 허용
            $table->string('ip', 45);                          // 중복 방지용
            $table->string('reason', 30);                      // SPAM | OBSCENE | ILLEGAL | ETC
            $table->string('detail', 500)->nullable();         // 기타 사유 상세
            $table->string('status', 20)->default('PENDING'); // PENDING | REVIEWED | DISMISSED
            $table->timestamps();

            $table->index('post_id');
            $table->index('status');
            // 같은 유저(IP)가 동일 게시글 중복 신고 방지
            $table->unique(['post_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
