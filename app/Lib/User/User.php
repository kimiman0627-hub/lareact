<?php

namespace App\Lib\User;

use App\Models\User\User as UserModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use App\Lib\Common\QueryTrait;
use App\Lib\Common\ResultTrait;


class User
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
            $this->where('U.id', '=', $this->params['id']);
        }
        
        if (!empty($this->params['email'] ?? null)) {
            $this->whereLike('U.email', $this->params['email']);
        }

        if (!empty($this->params['name'] ?? null)) {
            $this->whereLike('U.name', $this->params['name']);
        }

        if (!empty($this->params['start_date'] ?? null) && !empty($this->params['end_date'] ?? null)) {
            $this->whereBetween('U.created_at', $this->params['start_date'], $this->params['end_date']);
        }

        $this->orderBy('U.created_at', 'DESC');
        $this->limit($this->params['page'] ?? 1, $this->params['per_page'] ?? 20);
    }

    /**
     * 쿼리 파라미터로 사용자 목록을 조회하고 ResultTrait 형식으로 반환합니다.
     *
     * @param array $params
     * @return array
     */
    public function getUserList()
    {
        try {
            return DB::select("SELECT * 
                FROM users AS U
                {$this->buildWhere()}
                {$this->buildOrderBy()} 
                {$this->buildLimit()}", $this->bindings);
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function getUserCount()
    {
        try {
            return DB::selectOne("SELECT COUNT(*) AS total 
                FROM users AS U
                {$this->buildWhere()}", $this->bindings)->total ?? 0;
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    /**
     * 사용자 전체 목록을 가져옵니다.
     *
     * @return Collection<UserModel>
     */
    public function all(): Collection
    {
        return UserModel::all();
    }

    /**
     * ID로 사용자 조회
     *
     * @param int $id
     * @return UserModel|null
     */
    public function find(int $id): ?UserModel
    {
        return UserModel::find($id);
    }

    /**
     * 이메일로 사용자 조회
     *
     * @param string $email
     * @return UserModel|null
     */
    public function findByEmail(string $email): ?UserModel
    {
        return UserModel::where('email', $email)->first();
    }

    /**
     * 신규 사용자 생성
     *
     * @param array $data
     * @return UserModel
     */
    public function create(array $data): UserModel
    {
        return UserModel::create($data);
    }

    /**
     * 기존 사용자 수정
     *
     * @param int $id
     * @param array $data
     * @return UserModel|null
     */
    public function update(int $id, array $data): ?UserModel
    {
        $user = $this->find($id);
        if (! $user) {
            return null;
        }

        $user->fill($data);
        $user->save();

        return $user;
    }

    /**
     * 사용자 삭제
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $user = $this->find($id);
        if (! $user) {
            return false;
        }

        return (bool) $user->delete();
    }
}
