<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->string('title')->comment('배너 제목');
            $table->string('image_url')->comment('이미지 경로');
            $table->string('link_url')->nullable()->comment('클릭 시 이동 URL');
            $table->boolean('is_new_tab')->default(false)->comment('새 탭 열기 여부');

            $table->string('banner_status')->comment('배너 상태 ACTIVE/INACTIVE');
            $table->string('banner_position')->comment('배너 위치 MAIN_TOP, MAIN_BOTTOM, SIDE');
            $table->unsignedInteger('sort_order')->default(0)->comment('정렬 순서');

            $table->date('start_date')->nullable()->comment('노출 시작일');
            $table->date('end_date')->nullable()->comment('노출 종료일');

            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
