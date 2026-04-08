<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('source')->nullable()->comment('크롤링 출처 사이트 (ex: DOGDRIP)')->after('post_id');
            $table->string('source_id')->nullable()->comment('출처 사이트의 게시글 ID')->after('source');
            $table->unique(['source', 'source_id'], 'posts_source_unique');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropUnique('posts_source_unique');
            $table->dropColumn(['source', 'source_id']);
        });
    }
};
