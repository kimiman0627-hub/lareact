<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('blogger_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id')->nullable();
            $table->string('post_title');
            $table->unsignedBigInteger('hits')->default(0);
            $table->string('source')->nullable();
            $table->string('blogger_post_id')->nullable();
            $table->string('blogger_url', 500)->nullable();
            $table->string('status');           // SUCCESS | FAILED
            $table->text('message')->nullable(); // 오류 메시지
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blogger_logs');
    }
};
