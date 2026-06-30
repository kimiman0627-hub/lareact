<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Model;

class UserPoint extends Model
{
    protected $table = 'user_points';
    protected $primaryKey = 'id';

    protected $guarded = ['id'];
}
