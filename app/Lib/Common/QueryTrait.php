<?php

namespace App\Lib\Common;

trait QueryTrait
{
    public array $params = [];
    protected array $whereConditions = [];
    protected array $orderBy = [];
    protected $bindings = []; 
    protected ?int $limitValue = null;
    protected ?int $offsetValue = null;

    public function initQuery(): self
    {
        $this->params = [];
        $this->whereConditions = [];
        $this->orderBy = [];
        $this->limitValue = null;
        $this->offsetValue = null;
        $this->bindings = [];

        return $this;
    }

    public function setParams($params) 
    {
        $this->params = $params;
    }

    public function getParams()
    {
        return $this->params;
    }

    public function addParam(string $key, $value): self
    {
        $this->params[$key] = $value;
        return $this;
    }

    public function addParams(array $params): self
    {
        $this->params = array_merge($this->params, $params);
        return $this;
    }

    public function where(string $column, string $operator, $value): self
    {
        $this->whereConditions[] = "$column $operator ?";
        $this->bindings[] = $value;
        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $this->whereConditions[] = "$column IN ($placeholders)";
        array_push($this->bindings, ...$values);
        return $this;
    }

    public function whereNotIn(string $column, array $values): self
    {
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $this->whereConditions[] = "$column NOT IN ($placeholders)";
        array_push($this->bindings, ...$values);
        return $this;
    }

    public function whereLike(string $column, string $value): self
    {
        $this->whereConditions[] = "$column LIKE ?";
        $this->bindings[] = "%$value%";
        return $this;
    }

    public function whereBetween(string $column, $start, $end): self
    {
        $this->whereConditions[] = "$column BETWEEN ? AND ?";
        $this->bindings[] = $start . ' 00:00:00';
        $this->bindings[] = $end . ' 23:59:59';
        return $this;
    }

    public function whereRange(string $column, $min, $max): self
    {
        return $this->whereBetween($column, $min, $max);
    }

    public function orWhereLike(string $column, string $value): self
    {
        if (empty($this->whereConditions)) {
            return $this->whereLike($column, $value);
        }
        $this->whereConditions[] = "OR $column LIKE ?";
        $this->bindings[] = "%$value%";
        return $this;
    }

    public function whereRaw(string $raw, array $bindings = []): self
    {
        $this->whereConditions[] = $raw;
        $this->bindings = array_merge($this->bindings, $bindings);
        return $this;
    }

    public function orderBy(string $column, string $direction = 'DESC'): self
    {
        $this->orderBy[] = "{$column} " . strtoupper($direction);
        return $this;
    }

    public function limit(int $page = 1, int $limit = 20): self
    {
        $this->limitValue = $limit;
        $this->offsetValue = ($page - 1) * $limit;
        return $this;
    }

    public function buildWhere(): string
    {
        return empty($this->whereConditions) ? '' : 'WHERE ' . implode(' AND ', $this->whereConditions);
    }

    public function buildOrderBy(): string
    {
        return empty($this->orderBy) ? '' : ' ORDER BY ' . implode(', ', $this->orderBy);
    }

    public function buildLimit(): string
    {
        if ($this->limitValue === null) {
            return '';
        }
        $sql = "LIMIT {$this->limitValue}";
        if ($this->offsetValue !== null) {
            $sql .= " OFFSET {$this->offsetValue}";
        }
        return $sql;
    }


}