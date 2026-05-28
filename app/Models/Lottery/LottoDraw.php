<?php

namespace App\Models\Lottery;

use Illuminate\Database\Eloquent\Model;

class LottoDraw extends Model
{
    protected $primaryKey = 'drw_no';
    public $incrementing  = false;
    public $timestamps    = false;

    protected $fillable = [
        'drw_no',
        'drw_date',
        'no1', 'no2', 'no3', 'no4', 'no5', 'no6',
        'bonus_no',
        'first_prize_amount',
        'first_prize_winners',
    ];

    protected $casts = [
        'drw_no'              => 'integer',
        'drw_date'            => 'date:Y-m-d',
        'first_prize_amount'  => 'integer',
        'first_prize_winners' => 'integer',
    ];
}
