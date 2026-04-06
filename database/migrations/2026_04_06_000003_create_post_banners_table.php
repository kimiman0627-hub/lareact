<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_banners', function (Blueprint $table) {
            $table->bigIncrements('post_banner_id');
            $table->unsignedBigInteger('post_id')->comment('논리적 FK: posts.post_id');
            $table->unsignedBigInteger('banner_id')->comment('논리적 FK: banners.banner_id');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            // 같은 게시물에 같은 배너 중복 방지
            $table->unique(['post_id', 'banner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_banners');
    }
};
