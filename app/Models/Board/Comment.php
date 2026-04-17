<?php

namespace App\Models\Board;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $primaryKey = 'comment_id';
    protected $guarded    = ['comment_id'];
}
