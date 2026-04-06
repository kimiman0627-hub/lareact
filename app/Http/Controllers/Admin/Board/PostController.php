<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Board\Post;
use App\Lib\Board\Post as PostLib;
use App\Lib\Banner\PostBanner as PostBannerLib;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;


class PostController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = self::validateIndex($request);

        $postLib = new PostLib($params);
        $list = $postLib->getList($params);
        $total = $postLib->getCount($params);
        if ($list === false || $total === false) {
            return $this->error($postLib->resultMessage, null, 500);
        }

        // banner_ids를 문자열에서 배열로 변환
        foreach ($list as $item) {
            $item->banner_ids = $item->banner_ids
                ? array_map('intval', explode(',', $item->banner_ids))
                : [];
        }

        $paginatedData = new LengthAwarePaginator(
            $list,
            $total,
            $params['per_page'] ?? 20,
            $params['page'] ?? 1,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // 배너 선택용: 활성화된 배너 전체 목록
        $banners = DB::select("SELECT banner_id, title, banner_position FROM banners WHERE banner_status = 'ACTIVE' AND deleted_at IS NULL ORDER BY sort_order ASC, banner_id ASC");

        return Inertia::render('Board/PostList', [
            'list'           => $paginatedData,
            'total'          => $total,
            'params'         => $params,
            'postTypes'      => config('config.post_types'),
            'postStatuses'   => config('config.post_statuses'),
            'postCategories' => config('config.post_categories'),
            'banners'        => $banners,
            'bannerPositions' => config('config.banner_positions'),
        ]);
    }

    public function validateIndex(Request $request)
    {
       $params = $request->validate([
            'id'          => 'nullable|string|max:100',
            'name'        => 'nullable|string|max:100',
            'email'       => 'nullable|string|max:100',
            'search_type' => 'nullable|in:title,content,all',
            'keyword'     => 'nullable|string|max:100',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'per_page'    => 'nullable|integer|min:1,max:100',
            'page'        => 'nullable|integer|min:1',
            'post_type'   => 'nullable|in:' . implode(',', array_keys(config('config.post_types'))),
            'post_status' => 'nullable|in:' . implode(',', array_keys(config('config.post_statuses'))),
            'is_notice'   => 'nullable|boolean',
            'post_category' => 'nullable|string|max:100',
        ]);
        return $params;
    }

    protected function validatePost(Request $request, $id = null)
    {
        try {
            $params = $request->validate([
                'user_id'       => ['required', 'integer', 'exists:users,id'],
                'post_status'   => 'required|in:' . implode(',', array_keys(config('config.post_statuses'))),
                'post_type'     => 'required|in:' . implode(',', array_keys(config('config.post_types'))),
                'post_category' => 'required|in:' . implode(',', array_keys(config('config.post_categories'))),
                'title'         => 'required|string|max:255',
                'content'       => 'required|string',
                'is_notice'     => 'required|in:0,1,true,false',
                'created_at'    => 'nullable|date',
                'banner_ids'    => 'nullable|array',
                'banner_ids.*'  => 'integer',
            ]);
            return $params;
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('validation 실패:', $e->errors());
            throw $e;
        }
    }

    public function store(Request $request)
    {
        $params = $this->validatePost($request);
        $params['is_notice'] = $request->boolean('is_notice', false);

        $bannerIds = $params['banner_ids'] ?? [];
        unset($params['banner_ids']);

        $postLib = new PostLib($params);
        $post = $postLib->create();

        if (!$post) {
            return $this->error('게시글을 생성할 수 없습니다.', null, 500);
        }

        if (!empty($bannerIds)) {
            $postBannerLib = new PostBannerLib();
            $postBannerLib->sync($post->post_id, $bannerIds);
        }

        return redirect()->route('admin.posts.index')->with('message', '게시글이 등록되었습니다.');
    }

    public function update(Request $request, $id)
    {
        $params = $this->validatePost($request, $id);
        $params['post_id'] = $id;
        $params['is_notice'] = $request->boolean('is_notice', false);

        $bannerIds = $params['banner_ids'] ?? [];
        unset($params['banner_ids']);

        $postLib = new PostLib($params);
        $post = $postLib->update();
        if (!$post) {
            return $this->error('게시글을 수정할 수 없습니다.', null, 404);
        }

        $postBannerLib = new PostBannerLib();
        $postBannerLib->sync((int) $id, $bannerIds);

        return redirect()->route('admin.posts.index')->with('message', '게시글이 수정되었습니다.');
    }

    public function destroy($id)
    {
        Log::info("Attempting to delete post with ID: {$id}");

        $postBannerLib = new PostBannerLib();
        $postBannerLib->deleteByPostId((int) $id);

        $postLib = new PostLib();
        $deleted = $postLib->delete((int) $id);

        if (!$deleted) {
            return $this->error('게시글을 삭제할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.posts.index')->with('message', '게시글이 삭제되었습니다.');
    }
}
