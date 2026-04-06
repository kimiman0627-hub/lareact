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

        if (!empty($this->params['start_date'] ?? null) && !empty($this->params['end_date'] ?? null)) {
            $this->whereBetween('P.created_at', $this->params['start_date'], $this->params['end_date']);
        }

        $this->orderBy('P.created_at', 'DESC');
        $this->limit($this->params['page'] ?? 1, $this->params['per_page'] ?? 20);
    }

    public function getList()
    {
        try {
            return DB::select("SELECT P.*,
                    U.email, U.name,
                    STRING_AGG(PB.banner_id::text, ',') AS banner_ids
                FROM posts AS P
                INNER JOIN users AS U ON P.user_id = U.id
                LEFT JOIN post_banners AS PB ON P.post_id = PB.post_id
                {$this->buildWhere()}
                GROUP BY P.post_id, U.id, U.email, U.name
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
