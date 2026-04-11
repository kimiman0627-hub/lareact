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
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
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

        // 게시판 설정에서 카테고리 목록 조회 (category => board_name)
        $boardRows = DB::select("SELECT category, board_name FROM boards WHERE board_status = 'ACTIVE' AND deleted_at IS NULL ORDER BY board_order ASC, board_id ASC");
        $postCategories = collect($boardRows)->pluck('board_name', 'category')->all();

        return Inertia::render('Board/PostList', [
            'list'            => $paginatedData,
            'total'           => $total,
            'params'          => $params,
            'postTypes'       => config('config.post_types'),
            'postStatuses'    => config('config.post_statuses'),
            'postCategories'  => $postCategories,
            'postSources'     => config('config.post_sources'),
            'banners'         => $banners,
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
            'source'        => 'nullable|string|max:50',
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
                'post_category' => [
                    'required', 'string',
                    Rule::exists('boards', 'category')
                        ->whereNull('deleted_at')
                        ->where('board_status', 'ACTIVE'),
                ],
                'title'         => 'required|string|max:255',
                'content'       => 'required|string',
                'is_notice'     => 'required|boolean',
                'created_at'    => 'nullable|date',
                'banner_ids'         => 'nullable|array',
                'banner_ids.*'       => 'integer',
                'uploaded_file_ids'  => 'nullable|array',
                'uploaded_file_ids.*'=> 'integer',
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

        $bannerIds       = $params['banner_ids'] ?? [];
        $uploadedFileIds = $params['uploaded_file_ids'] ?? [];
        unset($params['banner_ids'], $params['uploaded_file_ids']);

        $postLib = new PostLib($params);
        $post = $postLib->create();

        if (!$post) {
            return $this->error('게시글을 생성할 수 없습니다.', null, 500);
        }

        if (!empty($bannerIds)) {
            $postBannerLib = new PostBannerLib();
            $postBannerLib->sync($post->post_id, $bannerIds);
        }

        // 업로드된 파일 ref_id 연결 + content 기준 동기화
        $this->syncContentFiles($post->post_id, $post->content, $uploadedFileIds);

        return redirect()->route('admin.posts.index')->with('message', '게시글이 등록되었습니다.');
    }

    public function update(Request $request, $id)
    {
        $params = $this->validatePost($request, $id);
        $params['post_id'] = $id;
        $params['is_notice'] = $request->boolean('is_notice', false);

        $bannerIds       = $params['banner_ids'] ?? [];
        $uploadedFileIds = $params['uploaded_file_ids'] ?? [];
        unset($params['banner_ids'], $params['uploaded_file_ids']);

        $postLib = new PostLib($params);
        $post = $postLib->update();
        if (!$post) {
            return $this->error('게시글을 수정할 수 없습니다.', null, 404);
        }

        $postBannerLib = new PostBannerLib();
        $postBannerLib->sync((int) $id, $bannerIds);

        // 새로 업로드된 파일 ref_id 연결 + content에서 제거된 파일 삭제
        $this->syncContentFiles((int) $id, $post->content, $uploadedFileIds);

        return redirect()->route('admin.posts.index')->with('message', '게시글이 수정되었습니다.');
    }

    /**
     * content HTML 기준으로 files 테이블 동기화
     * - 새로 업로드된 파일의 ref_id 연결
     * - content에서 제거된 파일은 스토리지 + DB에서 삭제
     */
    private function syncContentFiles(int $postId, string $content, array $newFileIds = []): void
    {
        // 1. 새로 업로드된 파일 ref_id 연결 (ref_id = null 인 것만)
        if (!empty($newFileIds)) {
            DB::table('files')
                ->whereIn('file_id', $newFileIds)
                ->where('file_kind', 'POST')
                ->whereNull('ref_id')
                ->update(['ref_id' => $postId]);
        }

        // 2. content에서 현재 사용 중인 서버 이미지 URL 추출
        preg_match_all('#/storage/uploads/post/[^\s"\'<>\)]+#', $content, $matches);
        $urlsInContent = array_unique($matches[0] ?? []);

        // 3. 이 포스트에 연결된 파일 중 content에 없는 것(고아 파일) 삭제
        $orphanQuery = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId);

        if (!empty($urlsInContent)) {
            $orphanQuery->whereNotIn('file_url', $urlsInContent);
        }

        $orphanFiles = $orphanQuery->get();
        foreach ($orphanFiles as $file) {
            // /storage/uploads/... → uploads/... (Storage::disk('public') 기준 경로)
            $storagePath = ltrim(str_replace('/storage/', '', $file->file_url), '/');
            Storage::disk('public')->delete($storagePath);
        }
        $orphanQuery->delete();
    }

    /**
     * 게시물 삭제 시 연결된 모든 파일 스토리지 + DB에서 삭제
     */
    private function deletePostFiles(int $postId): void
    {
        $files = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->get();

        foreach ($files as $file) {
            $storagePath = ltrim(str_replace('/storage/', '', $file->file_url), '/');
            Storage::disk('public')->delete($storagePath);
        }

        DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->delete();
    }

    public function search(Request $request)
    {
        $keyword = trim($request->input('keyword', ''));

        $query = DB::table('posts')
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at');

        if ($keyword !== '') {
            $query->where('title', 'ilike', '%' . $keyword . '%');
        }

        $posts = $query->orderByDesc('created_at')
            ->limit(15)
            ->get(['post_id', 'title', 'post_category', 'created_at']);

        return response()->json($posts);
    }

    public function destroy($id)
    {
        // 연결된 파일 스토리지 + DB에서 삭제
        $this->deletePostFiles((int) $id);

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
