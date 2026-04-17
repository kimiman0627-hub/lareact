<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // 서비스 게시판 목록: WHERE post_category=? AND post_status='ACTIVE' AND deleted_at IS NULL
            //                     ORDER BY is_notice DESC, created_at DESC
            $table->index(
                ['post_category', 'post_status', 'deleted_at', 'created_at'],
                'posts_category_list_idx'
            );

            // 관리자 목록 기본 정렬: ORDER BY created_at DESC (검색 조건 없을 때)
            $table->index(['created_at'], 'posts_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_category_list_idx');
            $table->dropIndex('posts_created_at_idx');
        });
    }
};
