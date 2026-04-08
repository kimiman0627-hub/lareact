<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->bigIncrements('board_id');

            // 게시판 기본 정보
            $table->string('board_name', 100)->comment('게시판명');
            $table->integer('board_order')->default(0)->comment('정렬 순서');
            $table->string('board_type', 20)->default('NORMAL')->comment('게시판 구분: NORMAL, SECRET, ANONYMOUS');
            $table->string('board_layout', 20)->default('GENERAL')->comment('게시판 타입: GENERAL, GALLERY, PHOTO, SIMPLE');
            $table->string('board_status', 20)->default('ACTIVE')->comment('상태: ACTIVE, INACTIVE');
            $table->string('category', 50)->unique()->comment('posts.post_category 매핑값');

            // 설정 (jsonb)
            $table->jsonb('options')->nullable()->comment('게시판 세부 설정');

            $table->timestamps();
            $table->softDeletes();

            $table->index('board_order');
            $table->index('board_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boards');
    }
};
