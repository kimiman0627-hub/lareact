<?php

namespace App\Lib\Board;

use App\Models\Board\Post as PostModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use App\Lib\Common\QueryTrait;
use App\Lib\Common\ResultTrait;

use Illuminate\Support\Facades\Log;

class Post
{
    use QueryTrait, ResultTrait;
    
    function __construct($params = [])
    {
        $this->initQuery();
        $this->initResult();
        $this->setParams($params);
        $this->genQuery();
    }

    public function genQuery()
    {
        if (!empty($this->params['id'] ?? null)) {
            $this->where('P.post_id', '=', $this->params['id']);
        }
        
        if (!empty($this->params['email'] ?? null)) {
            $this->whereLike('U.email', $this->params['email']);
        }

        if (!empty($this->params['name'] ?? null)) {
            $this->whereLike('U.name', $this->params['name']);
        }

        if (!empty($this->params['search_type'] ?? null) && !empty($this->params['keyword'] ?? null)) {
            switch ($this->params['search_type']) {
                case 'title':
                    $this->whereLike('P.title', $this->params['keyword']);
                    break;
                case 'content':
                    $this->whereLike('P.content', $this->params['keyword']);
                    break;
                case 'all':
                    $this->whereRaw('(P.title ILIKE ? OR P.content ILIKE ?)', ['%' . $this->params['keyword'] . '%', '%' . $this->params['keyword'] . '%']);
                    break;
            }
        }

        if (!empty($this->params['post_status'] ?? null)) {
            $this->where('P.post_status', '=', $this->params['post_status']);
        }

        if (!empty($this->params['post_type'] ?? null)) {
            $this->where('P.post_type', '=', $this->params['post_type']);
        }

        if (!empty($this->params['post_category'] ?? null)) {
            $this->where('P.post_category', '=', $this->params['post_category']);
        }

        if (!empty($this->params['exclude_id'] ?? null)) {
            $this->where('P.post_id', '!=', $this->params['exclude_id']);
        }

        if (!empty($this->params['source'] ?? null)) {
            if ($this->params['source'] === 'DIRECT') {
                $this->whereRaw('P.source IS NULL');
            } else {
                $this->where('P.source', '=', $this->params['source']);
            }
        }

        if (isset($this->params['is_notice']) && $this->params['is_notice'] !== '') {
            $this->where('P.is_notice', '=', $this->params['is_notice'] ? 'true' : 'false');
        }

        if (!empty($this->params['start_date'] ?? null) && !empty($this->params['end_date'] ?? null)) {
            $this->whereBetween('P.created_at', $this->params['start_date'], $this->params['end_date']);
        }

        if (!empty($this->params['order_by_notice'] ?? null)) {
            $this->orderBy('P.is_notice', 'DESC');
        }
        $this->orderBy('P.created_at', 'DESC');
        $this->limit($this->params['page'] ?? 1, $this->params['per_page'] ?? 20);
    }

    public function getList()
    {
        try {
            // GROUP BY 제거 → LATERAL JOIN 방식으로 변경.
            // 이전: LEFT JOIN post_banners + GROUP BY → LIMIT 전에 전체 행 집계 (느림)
            // 이후: LATERAL 서브쿼리 → LIMIT 이후 20행에만 실행 (빠름)
            // content·post_data 제외: 목록에 불필요한 대용량 컬럼을 빼 네트워크·메모리 절감.
            // 수정 시 content는 /admin/posts/{id} 개별 조회로 가져옴.
            return DB::select("SELECT
                    P.post_id, P.source, P.source_id, P.user_id,
                    P.post_status, P.post_type, P.post_category,
                    P.title, P.hits, P.comment_count, P.like_count, P.dislike_count,
                    P.is_notice, P.created_at, P.updated_at,
                    P.post_data->>'blogger_post_id' AS blogger_post_id,
                    P.post_data->>'blogger_url'     AS blogger_url,
                    U.email, U.name,
                    COALESCE(pb.banner_ids, '') AS banner_ids,
                    COALESCE(fi.has_image, false) AS has_image,
                    COALESCE(sc.scrap_count, 0) AS scrap_count
                FROM posts AS P
                INNER JOIN users AS U ON P.user_id = U.id
                LEFT JOIN LATERAL (
                    SELECT STRING_AGG(banner_id::text, ',') AS banner_ids
                    FROM post_banners WHERE post_id = P.post_id
                ) pb ON true
                LEFT JOIN LATERAL (
                    SELECT true AS has_image
                    FROM files WHERE file_kind = 'POST' AND ref_id = P.post_id LIMIT 1
                ) fi ON true
                LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS scrap_count FROM scraps WHERE post_id = P.post_id
                ) sc ON true
                {$this->buildWhere()}
                {$this->buildOrderBy()}
                {$this->buildLimit()}", $this->bindings);
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function getCount()
    {
        try {
            return DB::selectOne("SELECT COUNT(DISTINCT P.post_id) AS total
                FROM posts AS P
                INNER JOIN users AS U ON P.user_id = U.id
                {$this->buildWhere()}", $this->bindings)->total ?? 0;
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

   

    /**
     * ID로 사용자 조회
     *
     * @param int $id
     * @return PostModel|null
     */
    public function find(int $id): ?PostModel
    {
        return PostModel::find($id);
    }

    
    /**
     * 신규 게시물 생성
     *
     * @param array $data
     * @return PostModel
     */
    public function create(): PostModel
    {
        return PostModel::create($this->params);
    }

    /**
     * 기존 게시물 수정
     *
     * @param int $id
     * @param array $data
     * @return PostModel|null
     */
    public function update(): ?PostModel
    {
        $post = $this->find($this->params['post_id'] ?? $this->params['id'] ?? 0);
        if (!$post) {
            return null;
        }

        $post->fill($this->params);
        $post->save();

        return $post;
    }

    /**
     * 게시물 삭제
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $post = $this->find($id);
        
        Log::info("Post delete - found post: " . ($post ? 'yes' : 'no'));
        if (!$post) {
            return false;
        }
        
        $result = $post->delete();  
        return (bool) $result;
    }
}
