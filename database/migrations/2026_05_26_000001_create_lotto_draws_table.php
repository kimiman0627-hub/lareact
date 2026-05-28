<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotto_draws', function (Blueprint $table) {
            $table->unsignedSmallInteger('drw_no')->primary();
            $table->date('drw_date');
            $table->unsignedTinyInteger('no1');
            $table->unsignedTinyInteger('no2');
            $table->unsignedTinyInteger('no3');
            $table->unsignedTinyInteger('no4');
            $table->unsignedTinyInteger('no5');
            $table->unsignedTinyInteger('no6');
            $table->unsignedTinyInteger('bonus_no');
            $table->unsignedBigInteger('first_prize_amount');
            $table->unsignedInteger('first_prize_winners');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lotto_draws');
    }
};
