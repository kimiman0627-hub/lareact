<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("UPDATE boards SET board_layout = UPPER(board_layout) WHERE board_layout ~ '^[a-z]'");
    }

    public function down(): void
    {
        DB::statement("UPDATE boards SET board_layout = LOWER(board_layout) WHERE board_layout ~ '^[A-Z]'");
    }
};
