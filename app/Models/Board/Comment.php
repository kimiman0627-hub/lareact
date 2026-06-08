<?php

namespace App\Models\Board;

use Database\Factories\CommentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $primaryKey = 'comment_id';
    protected $guarded    = ['comment_id'];

    protected static function newFactory(): CommentFactory
    {
        return CommentFactory::new();
    }
}
