<?php

namespace App\Models\Board;

use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $primaryKey = 'post_id';
    protected $guarded = ['post_id'];

    protected static function newFactory(): PostFactory
    {
        return PostFactory::new();
    }
}
