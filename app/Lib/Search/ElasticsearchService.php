<?php

namespace App\Lib\Search;

use Elastic\Elasticsearch\Client;
use Elastic\Elasticsearch\ClientBuilder;
use Illuminate\Support\Facades\Log;

class ElasticsearchService
{
    private const INDEX = 'posts';

    private Client $client;

    public function __construct()
    {
        $this->client = ClientBuilder::create()
            ->setHosts([config('elasticsearch.host', 'http://localhost:9200')])
            ->build();
    }

    public function dropIndex(): void
    {
        if ($this->client->indices()->exists(['index' => self::INDEX])->asBool()) {
            $this->client->indices()->delete(['index' => self::INDEX]);
        }
    }

    public function createIndex(): void
    {
        if ($this->client->indices()->exists(['index' => self::INDEX])->asBool()) {
            return;
        }

        $this->client->indices()->create([
            'index' => self::INDEX,
            'body'  => [
                'settings' => [
                    'analysis' => [
                        'analyzer' => [
                            'nori_analyzer' => [
                                'type'      => 'custom',
                                'tokenizer' => 'nori_tokenizer',
                                'filter'    => ['nori_readingform', 'lowercase'],
                            ],
                        ],
                    ],
                ],
                'mappings' => [
                    'properties' => [
                        'post_id'       => ['type' => 'integer'],
                        'title'         => ['type' => 'text', 'analyzer' => 'nori_analyzer'],
                        'content'       => ['type' => 'text', 'analyzer' => 'nori_analyzer'],
                        'post_category' => ['type' => 'keyword'],
                        'post_status'   => ['type' => 'keyword'],
                        'source'        => ['type' => 'keyword'],
                        'author'        => ['type' => 'keyword'],
                        'board_name'    => ['type' => 'keyword'],
                        'hits'          => ['type' => 'integer'],
                        'comment_count' => ['type' => 'integer'],
                        'has_image'     => ['type' => 'boolean'],
                        'created_at'    => ['type' => 'date'],
                    ],
                ],
            ],
        ]);
    }

    public function indexPost(array $data): void
    {
        try {
            $this->client->index([
                'index' => self::INDEX,
                'id'    => $data['post_id'],
                'body'  => $this->buildDocument($data),
            ]);
        } catch (\Throwable $e) {
            Log::error('ES index failed', ['post_id' => $data['post_id'], 'error' => $e->getMessage()]);
        }
    }

    public function deletePost(int $postId): void
    {
        try {
            $this->client->delete(['index' => self::INDEX, 'id' => $postId]);
        } catch (\Throwable $e) {
            Log::error('ES delete failed', ['post_id' => $postId, 'error' => $e->getMessage()]);
        }
    }

    public function search(string $query, int $page, int $perPage): array
    {
        $from = ($page - 1) * $perPage;

        $response = $this->client->search([
            'index' => self::INDEX,
            'body'  => [
                'from'  => $from,
                'size'  => $perPage,
                'query' => [
                    'bool' => [
                        'must'   => [
                            'multi_match' => [
                                'query'  => $query,
                                'fields' => ['title^3', 'content'],
                                'type'   => 'best_fields',
                            ],
                        ],
                        'filter' => [
                            ['term' => ['post_status' => 'ACTIVE']],
                        ],
                    ],
                ],
                'sort' => [
                    ['_score' => ['order' => 'desc']],
                    ['created_at' => ['order' => 'desc']],
                ],
            ],
        ]);

        $hits  = $response['hits'];
        $total = $hits['total']['value'];
        $items = collect($hits['hits'])->map(fn($h) => (object) $h['_source']);

        return ['total' => $total, 'items' => $items];
    }

    public function bulkIndex(iterable $posts): int
    {
        $count  = 0;
        $params = ['body' => []];

        foreach ($posts as $post) {
            $params['body'][] = ['index' => ['_index' => self::INDEX, '_id' => $post->post_id]];
            $params['body'][] = $this->buildDocument((array) $post);
            $count++;

            if ($count % 500 === 0) {
                $this->client->bulk($params);
                $params = ['body' => []];
            }
        }

        if (!empty($params['body'])) {
            $this->client->bulk($params);
        }

        return $count;
    }

    public function isHealthy(): bool
    {
        try {
            $this->client->ping();
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function buildDocument(array $data): array
    {
        return [
            'post_id'       => $data['post_id'],
            'title'         => $data['title'] ?? '',
            'content'       => strip_tags($data['content'] ?? ''),
            'post_category' => $data['post_category'] ?? '',
            'post_status'   => $data['post_status'] ?? 'ACTIVE',
            'source'        => $data['source'] ?? null,
            'author'        => $data['author'] ?? null,
            'board_name'    => $data['board_name'] ?? null,
            'hits'          => (int) ($data['hits'] ?? 0),
            'comment_count' => (int) ($data['comment_count'] ?? 0),
            'has_image'     => (bool) ($data['has_image'] ?? false),
            'created_at'    => isset($data['created_at'])
                ? date('c', strtotime($data['created_at']))
                : date('c'),
        ];
    }
}
