<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Model;

class UserAttendance extends Model
{
    protected $table = 'user_attendances';
    protected $guarded = ['id'];
    protected $casts = ['attended_date' => 'date'];
}
