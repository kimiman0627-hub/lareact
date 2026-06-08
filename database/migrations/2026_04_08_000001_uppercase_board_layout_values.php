<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE boards SET board_layout = UPPER(board_layout) WHERE board_layout ~ '^[a-z]'");
        } else {
            DB::statement("UPDATE boards SET board_layout = UPPER(board_layout) WHERE board_layout GLOB '*[a-z]*'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE boards SET board_layout = LOWER(board_layout) WHERE board_layout ~ '^[A-Z]'");
        } else {
            DB::statement("UPDATE boards SET board_layout = LOWER(board_layout) WHERE board_layout GLOB '*[A-Z]*'");
        }
    }
};
