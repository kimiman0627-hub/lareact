<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            // EXISTS (SELECT 1 FROM files WHERE file_kind='POST' AND ref_id=?) 쿼리 최적화
            $table->index(['file_kind', 'ref_id'], 'files_kind_ref_idx');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropIndex('files_kind_ref_idx');
        });
    }
};
