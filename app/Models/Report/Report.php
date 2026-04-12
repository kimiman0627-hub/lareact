<?php

namespace App\Models\Report;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'post_id', 'user_id', 'ip', 'reason', 'detail', 'status',
    ];
}
