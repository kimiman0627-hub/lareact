<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Board\Post;
use App\Lib\Board\Post as PostLib;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;


class PostController extends Controller
{
    //
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

        $paginatedData = new LengthAwarePaginator(
            $list, 
            $total, 
            $this->params['per_page'] ?? 20, 
            $this->params['page'] ?? 1, 
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Board/PostList', [
            'list' => $paginatedData,
            'total' => $total,
            'params' => $params,
            'postTypes' => config('config.post_types'),
            'postStatuses' => config('config.post_statuses'),
            'postCategories' => config('config.post_categories'),
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
            ]);
            return $params;
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('validation 실패:', $e->errors());  // 추가
            throw $e;
        }
    }

    public function store(Request $request)
    {
        
        // Log::info('request all:', $request->all());
        // Log::info('request headers:', $request->headers->all());
        $params = $this->validatePost($request);
        // Log::info('params:', $params);
        //$data = $this->validatePost($request);
        $data['is_notice'] = $request->boolean('is_notice', false);

        $postLib = new PostLib($params);
        $post = $postLib->create();

        if (!$post) {
            return $this->error('게시글을 생성할 수 없습니다.', null, 500);
        }

        return redirect()->route('admin.posts.index')->with('message', '게시글이 등록되었습니다.');
    }

    public function update(Request $request, $id)
    {
        $params = $this->validatePost($request, $id);
        $params['is_notice'] = $request->boolean('is_notice', false);

        $postLib = new PostLib($params);
        $post = $postLib->update();
        if (!$post) {
            return $this->error('게시글을 수정할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.posts.index')->with('message', '게시글이 수정되었습니다.');
    }

    public function destroy($id)
    {
        $postLib = new PostLib();
        $deleted = $postLib->delete((int) $id);

        if (!$deleted) {
            return $this->error('게시글을 삭제할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.posts.index')->with('message', '게시글이 삭제되었습니다.');
    }
}
