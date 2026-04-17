<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            // 저장소 종류: LOCAL(서버 로컬), NCP(네이버 클라우드 Object Storage)
            $table->string('storage', 20)->default('LOCAL')
                  ->comment('저장소: LOCAL | NCP')
                  ->after('file_id');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropColumn('storage');
        });
    }
};
