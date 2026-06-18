<?php

namespace App\Models\Board;

use App\Lib\Search\ElasticsearchService;
use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Post extends Model
{
    use HasFactory;

    protected $primaryKey = 'post_id';
    protected $guarded = ['post_id'];

    protected static function newFactory(): PostFactory
    {
        return PostFactory::new();
    }

    protected static function booted(): void
    {
        static::saved(function (Post $post) {
            if ($post->post_status !== 'ACTIVE') {
                app(ElasticsearchService::class)->deletePost($post->post_id);
                return;
            }

            $row = DB::table('posts as p')
                ->join('users as u', 'p.user_id', '=', 'u.id')
                ->join('boards as b', 'p.post_category', '=', 'b.category')
                ->where('p.post_id', $post->post_id)
                ->select([
                    'p.post_id', 'p.title', 'p.content', 'p.hits', 'p.comment_count',
                    'p.created_at', 'p.post_category', 'p.post_status', 'p.source',
                    'u.name as author',
                    'b.board_name',
                    DB::raw("EXISTS (SELECT 1 FROM files WHERE file_kind = 'POST' AND ref_id = p.post_id) AS has_image"),
                ])
                ->first();

            if ($row) {
                app(ElasticsearchService::class)->indexPost((array) $row);
            }
        });

        static::deleted(function (Post $post) {
            app(ElasticsearchService::class)->deletePost($post->post_id);
        });
    }
}
