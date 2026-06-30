<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Lib\Board\Board as BoardLib;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BoardController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = $this->validateIndex($request);

        $boardLib = new BoardLib($params);
        $list  = $boardLib->getList();
        $total = $boardLib->getCount();

        if ($list === false || $total === false) {
            return $this->error($boardLib->resultMessage, null, 500);
        }

        // options JSON 문자열 → 배열 변환
        foreach ($list as $item) {
            if (is_string($item->options)) {
                $item->options = json_decode($item->options, true) ?? [];
            }
        }

        $paginatedData = new LengthAwarePaginator(
            $list,
            $total,
            $params['per_page'] ?? 20,
            $params['page']     ?? 1,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Board/BoardList', [
            'list'           => $paginatedData,
            'total'          => $total,
            'params'         => $params,
            'boardTypes'     => config('config.board_types'),
            'boardLayouts'   => config('config.board_layouts'),
            'boardStatuses'  => config('config.board_statuses'),
            'boardOptions'   => config('config.board_options'),
        ]);
    }

    protected function validateIndex(Request $request): array
    {
        return $request->validate([
            'keyword'      => 'nullable|string|max:100',
            'board_status' => 'nullable|in:' . implode(',', array_keys(config('config.board_statuses'))),
            'board_type'   => 'nullable|in:' . implode(',', array_keys(config('config.board_types'))),
            'per_page'     => 'nullable|integer|min:1|max:100',
            'page'         => 'nullable|integer|min:1',
        ]);
    }

    protected function validateBoard(Request $request): array
    {
        try {
            return $request->validate([
                'board_name'   => 'required|string|max:100',
                'board_order'  => 'required|integer|min:0',
                'board_type'   => 'required|in:' . implode(',', array_keys(config('config.board_types'))),
                'board_layout' => 'required|in:' . implode(',', array_keys(config('config.board_layouts'))),
                'board_status' => 'required|in:' . implode(',', array_keys(config('config.board_statuses'))),
                'category'     => 'required|string|max:50|alpha_dash',
                'options'      => 'nullable|array',
                // 권한
                'options.read_permission'    => 'nullable|in:ALL,MEMBER,ADMIN',
                'options.write_permission'   => 'nullable|in:ALL,MEMBER,ADMIN',
                'options.comment_enabled'    => 'nullable|boolean',
                'options.comment_permission' => 'nullable|in:ALL,MEMBER,ADMIN',
                'options.comment_depth'      => 'nullable|integer|min:1|max:5',
                'options.allow_anonymous'    => 'nullable|boolean',
                'options.show_anonymous'     => 'nullable|boolean',
                'options.secret_comment'     => 'nullable|boolean',
                // 게시글 포인트
                'options.point_enabled'         => 'nullable|boolean',
                'options.point_amount'          => 'nullable|integer|min:0',
                'options.point_cycle'           => 'nullable|in:ONCE,DAILY,PER_POST',
                // 댓글 포인트
                'options.comment_point_enabled' => 'nullable|boolean',
                'options.comment_point_amount'  => 'nullable|integer|min:0',
                'options.comment_point_cycle'   => 'nullable|in:ONCE,DAILY,PER_POST',
                // 파일
                'options.file_upload'        => 'nullable|boolean',
                'options.file_size_limit'    => 'nullable|integer|min:1|max:500',
                // 기타
                'options.posts_per_page'     => 'nullable|integer|min:5|max:100',
                'options.use_like'           => 'nullable|boolean',
                'options.use_dislike'        => 'nullable|boolean',
                'options.thumbnail_enabled'  => 'nullable|boolean',
                'options.notice_count'       => 'nullable|integer|min:0|max:20',
                'options.show_on_main'       => 'nullable|boolean',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('board validation 실패:', $e->errors());
            throw $e;
        }
    }

    public function store(Request $request)
    {
        $params = $this->validateBoard($request);

        $boardLib = new BoardLib($params);
        $board = $boardLib->create();

        if (!$board) {
            return $this->error('게시판을 생성할 수 없습니다.', null, 500);
        }

        return redirect()->route('admin.boards.index')->with('message', '게시판이 등록되었습니다.');
    }

    public function update(Request $request, $id)
    {
        $params = $this->validateBoard($request);
        $params['board_id'] = (int) $id;

        $boardLib = new BoardLib($params);
        $board = $boardLib->update();

        if (!$board) {
            return $this->error('게시판을 수정할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.boards.index')->with('message', '게시판이 수정되었습니다.');
    }

    public function destroy($id)
    {
        $boardLib = new BoardLib();
        $deleted  = $boardLib->delete((int) $id);

        if (!$deleted) {
            return $this->error('게시판을 삭제할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.boards.index')->with('message', '게시판이 삭제되었습니다.');
    }
}
