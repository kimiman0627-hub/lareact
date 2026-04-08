<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            // 배너 타입: IMAGE, HTML, IFRAME, SCRIPT, VIDEO
            $table->string('banner_type')->default('IMAGE')->after('banner_position')
                ->comment('배너 타입 IMAGE/HTML/IFRAME/SCRIPT/VIDEO');

            // IMAGE 타입 외 HTML/IFRAME/SCRIPT/VIDEO 의 실제 콘텐츠 저장
            $table->text('content')->nullable()->after('image_url')
                ->comment('HTML/iframe/script/video 콘텐츠 (IMAGE 타입 외)');

            // image_url 은 nullable 로 변경 (IMAGE 타입에서만 사용)
            $table->string('image_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->dropColumn(['banner_type', 'content']);
            $table->string('image_url')->nullable(false)->change();
        });
    }
};
