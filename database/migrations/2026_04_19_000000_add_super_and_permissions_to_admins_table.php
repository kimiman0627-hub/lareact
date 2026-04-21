<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->boolean('is_super')->default(false)->after('email');
            $table->json('menu_permissions')->nullable()->after('is_super');
        });

        // 기존 관리자는 모두 슈퍼 관리자로 처리
        DB::table('admins')->update(['is_super' => true]);
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['is_super', 'menu_permissions']);
        });
    }
};
