<?php

namespace App\Models\Board;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Board extends Model
{
    protected $primaryKey = 'board_id';
    protected $guarded = ['board_id'];

    protected $casts = [
        'options' => 'array',
    ];

    public static function getBoards(): array
    {
        $boards = DB::table('boards')
            ->where('board_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->orderBy('board_order')
            ->orderBy('board_id')
            ->get(['board_id', 'board_name', 'category', 'board_layout']);

        foreach ($boards as $board) {
            $board->posts = DB::table('posts as p')
                ->join('users as u', 'p.user_id', '=', 'u.id')
                ->where('p.post_category', $board->category)
                ->where('p.post_status', 'ACTIVE')
                ->whereNull('p.deleted_at')
                ->orderByDesc('p.is_notice')
                ->orderByDesc('p.created_at')
                ->limit(5)
                ->get([
                    'p.post_id',
                    'p.title',
                    'p.hits',
                    'p.comment_count',
                    'p.created_at',
                    'p.is_notice',
                    'u.name as author',
                ]);
        }

        return $boards->toArray();
    }
}
