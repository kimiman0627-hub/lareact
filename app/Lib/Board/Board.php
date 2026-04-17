<?php

namespace App\Lib\Board;

use App\Models\Board\Board as BoardModel;
use Illuminate\Support\Facades\DB;
use App\Lib\Common\QueryTrait;
use App\Lib\Common\ResultTrait;

class Board
{
    use QueryTrait, ResultTrait;

    public function __construct(array $params = [])
    {
        $this->initQuery();
        $this->initResult();
        $this->setParams($params);
        $this->genQuery();
    }

    public function genQuery(): void
    {
        if (!empty($this->params['keyword'] ?? null)) {
            $this->whereLike('B.board_name', $this->params['keyword']);
        }

        if (!empty($this->params['board_status'] ?? null)) {
            $this->where('B.board_status', '=', $this->params['board_status']);
        }

        if (!empty($this->params['board_type'] ?? null)) {
            $this->where('B.board_type', '=', $this->params['board_type']);
        }

        $this->orderBy('B.board_order', 'ASC');
        $this->orderBy('B.board_id', 'ASC');
        $this->limit($this->params['page'] ?? 1, $this->params['per_page'] ?? 20);
    }

    public function getList(): array|false
    {
        try {
            return DB::select(
                "SELECT B.* FROM boards AS B
                {$this->buildWhere()}
                {$this->buildOrderBy()}
                {$this->buildLimit()}",
                $this->bindings
            );
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function getCount(): int|false
    {
        try {
            // WHERE 조건에서 LIMIT/OFFSET 바인딩을 제외하기 위해 별도 인스턴스 사용
            return DB::selectOne(
                "SELECT COUNT(*) AS total FROM boards AS B
                {$this->buildWhere()}",
                $this->bindings
            )->total ?? 0;
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function find(int $id): ?BoardModel
    {
        return BoardModel::find($id);
    }

    public function create(): BoardModel
    {
        $data = $this->params;
        if (isset($data['options']) && is_array($data['options'])) {
            $data['options'] = json_encode($data['options']);
        }
        return BoardModel::create($data);
    }

    public function update(): ?BoardModel
    {
        $board = $this->find($this->params['board_id'] ?? 0);
        if (!$board) {
            return null;
        }

        $data = $this->params;
        unset($data['board_id']);

        $board->fill($data);
        $board->save();

        return $board;
    }

    public function delete(int $id): bool
    {
        $board = $this->find($id);
        if (!$board) {
            return false;
        }
        return (bool) $board->delete();
    }
}
