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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
             // 회원 고유번호 (users 테이블이 있다고 가정)
            $table->unsignedBigInteger('user_id');
            
            $table->string('post_status')->comment('게시글 상태 NORMAL, HIDDEN, DELETED');
            $table->string('post_type')->comment('게시글 타입 (ex: notice, gallery, event)');
            $table->string('post_category')->comment('게시글 구분');
            
            $table->string('title');
            $table->text('content');
            
            // PostgreSQL 전용 jsonb 타입
            $table->jsonb('post_data')->nullable()->comment('기타 설정 및 추가 데이터');
            $table->unsignedBigInteger('hits')->default(0)->index();
            $table->unsignedInteger('comment_count')->default(0);
            $table->boolean('is_notice')->default(false);
            $table->softDeletes(); // 선택사항: 삭제 시 레코드 보존(deleted_at)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
