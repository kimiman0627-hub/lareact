<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crawl_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 50)->index();          // DCINSIDE, DOGDRIP, ...
            $table->string('command', 100);                  // crawl:dcinside
            $table->string('status', 20)->default('RUNNING'); // RUNNING / DONE / FAILED
            $table->unsignedInteger('total_found')->default(0);
            $table->unsignedInteger('total_saved')->default(0);
            $table->unsignedInteger('total_skipped')->default(0);
            $table->unsignedInteger('total_errors')->default(0);
            $table->jsonb('error_log')->nullable();          // [{message, time}, ...]
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crawl_logs');
    }
};
