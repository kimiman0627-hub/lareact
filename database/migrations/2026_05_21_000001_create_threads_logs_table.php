<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('threads_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id')->nullable();
            $table->string('post_title');
            $table->unsignedBigInteger('hits')->default(0);
            $table->string('source')->nullable();
            $table->string('threads_media_id')->nullable();
            $table->string('threads_permalink', 500)->nullable();
            $table->string('status');            // SUCCESS | FAILED
            $table->text('message')->nullable(); // 오류 메시지
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('threads_logs');
    }
};
