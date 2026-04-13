<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BoardController extends Controller
{
    public function index(Request $request, string $category)
    {
        Inertia::setRootView('app');

        $board = DB::table('boards')
            ->where('category', $category)
            ->where('board_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->first();

        if (!$board) {
            abort(404);
        }

        $options    = is_string($board->options) ? json_decode($board->options, true) : (array) $board->options;
        $perPage    = (int) ($options['posts_per_page'] ?? 20);
        $page       = max(1, (int) $request->input('page', 1));

        $baseQuery = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->where('p.post_category', $category)
            ->where('p.post_status', 'ACTIVE')
            ->whereNull('p.deleted_at');

        $total = (clone $baseQuery)->count();

        $posts = (clone $baseQuery)
            ->orderByDesc('p.is_notice')
            ->orderByDesc('p.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'p.post_id', 'p.title', 'p.is_notice', 'p.hits',
                'p.comment_count', 'p.created_at', 'p.source',
                'u.name as author',
                DB::raw("EXISTS (SELECT 1 FROM files WHERE file_kind = 'POST' AND ref_id = p.post_id) AS has_image"),
            ]);

        $paginated = new LengthAwarePaginator(
            $posts,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $canonical = url('/board/' . $category) . ($page > 1 ? '?page=' . $page : '');

        return Inertia::render('Board/BoardList', [
            'board' => $board,
            'list'  => $paginated,
            'seo'   => [
                'title'       => $board->board_name . ' 게시판 | ' . config('app.name'),
                'description' => $board->board_name . ' 게시판의 최신 게시글을 확인하세요.',
                'canonical'   => $canonical,
                'ogType'      => 'website',
            ],
        ]);
    }

    public function show(int $id)
    {
        Inertia::setRootView('app');

        $post = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_id', $id)
            ->where('p.post_status', 'ACTIVE')
            ->whereNull('p.deleted_at')
            ->first([
                'p.post_id', 'p.title', 'p.content', 'p.is_notice',
                'p.hits', 'p.comment_count', 'p.like_count', 'p.dislike_count',
                'p.created_at', 'p.post_category', 'p.source',
                'u.name as author',
                'b.board_name', 'b.category', 'b.options as board_options',
            ]);

        if (!$post) {
            abort(404);
        }

        DB::table('posts')->where('post_id', $id)->increment('hits');

        $boardOptions = $post->board_options
            ? json_decode($post->board_options, true)
            : [];
        $maxDepth     = (int) ($boardOptions['comment_depth'] ?? 2);

        $comments = DB::table('comments as c')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->where('c.post_id', $id)
            ->whereNull('c.deleted_at')
            ->orderBy('c.created_at')
            ->get(['c.comment_id', 'c.parent_id', 'c.depth', 'c.content', 'c.created_at', 'c.user_id', 'u.name as author']);

        // 로그인 유저의 좋아요/싫어요, 스크랩 상태
        $userId   = auth()->id();
        $userType = $userId
            ? DB::table('post_likes')
                ->where('post_id', $id)->where('user_id', $userId)
                ->value('type')
            : null;

        $isScrapped = $userId
            ? DB::table('scraps')->where('user_id', $userId)->where('post_id', $id)->exists()
            : false;

        $scrapCount = DB::table('scraps')->where('post_id', $id)->count();

        // 이전글 / 다음글 (같은 게시판, 공지 제외)
        $sibling = DB::table('posts')
            ->where('post_category', $post->post_category)
            ->where('post_status', 'ACTIVE')
            ->where('is_notice', false)
            ->whereNull('deleted_at');

        $prevPost = (clone $sibling)
            ->where('post_id', '<', $id)
            ->orderByDesc('post_id')
            ->first(['post_id', 'title']);

        $nextPost = (clone $sibling)
            ->where('post_id', '>', $id)
            ->orderBy('post_id')
            ->first(['post_id', 'title']);

        // SEO: 본문에서 description 추출 (HTML 제거 후 160자)
        $rawText    = mb_substr(trim(strip_tags($post->content)), 0, 160);
        $description = mb_strlen($rawText) >= 155 ? $rawText . '...' : $rawText;

        // OG 이미지: 게시글 첫 번째 첨부 이미지
        $ogImage = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $id)
            ->orderBy('file_id')
            ->value('file_url');

        return Inertia::render('Board/PostDetail', [
            'post'         => $post,
            'comments'     => $comments,
            'maxDepth'     => $maxDepth,
            'boardOptions' => $boardOptions,
            'userLikeType' => $userType,
            'isScrapped'   => $isScrapped,
            'scrapCount'   => $scrapCount,
            'prevPost'     => $prevPost,
            'nextPost'     => $nextPost,
            'seo'          => [
                'title'       => $post->title . ' | ' . $post->board_name . ' | ' . config('app.name'),
                'description' => $description,
                'canonical'   => url('/post/' . $id),
                'ogType'      => 'article',
                'ogImage'     => $ogImage ? url($ogImage) : null,
                'publishedAt' => $post->created_at,
                'author'      => $post->author,
            ],
        ]);
    }
}
