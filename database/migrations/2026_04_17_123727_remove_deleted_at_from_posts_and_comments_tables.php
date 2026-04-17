<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // posts: deleted_at 포함 인덱스 제거 후 컬럼 삭제, 인덱스 재생성
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_category_list_idx');
            $table->dropColumn('deleted_at');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index(
                ['post_category', 'post_status', 'created_at'],
                'posts_category_list_idx'
            );
        });

        // comments: deleted_at 컬럼 제거
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_category_list_idx');
            $table->index(
                ['post_category', 'post_status', 'deleted_at', 'created_at'],
                'posts_category_list_idx'
            );
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->softDeletes();
        });
    }
};
