<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->bigIncrements('file_id');
            $table->timestamps();

            $table->string('file_kind')->comment('파일 종류: BANNER, POST 등');
            $table->unsignedBigInteger('ref_id')->nullable()->comment('연결된 레코드 ID (banner_id, post_id 등)');

            $table->string('original_name')->comment('원본 파일명');
            $table->string('stored_name')->comment('저장된 파일명');
            $table->string('file_path')->comment('storage 기준 상대 경로');
            $table->string('file_url')->comment('퍼블릭 접근 URL');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->default(0)->comment('바이트 단위');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
