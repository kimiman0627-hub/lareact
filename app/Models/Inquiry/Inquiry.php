<?php

namespace App\Models\Inquiry;

use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    protected $fillable = [
        'type', 'user_id', 'name', 'email', 'phone',
        'title', 'content', 'status', 'answer', 'answered_at',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
    ];
}
