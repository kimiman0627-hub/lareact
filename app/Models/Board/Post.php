<?php

namespace App\Models\Board;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $primaryKey = 'post_id';
    protected $guarded = ['post_id'];
}
