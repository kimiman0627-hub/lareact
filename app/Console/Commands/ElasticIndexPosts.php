<?php

namespace App\Console\Commands;

use App\Lib\Search\ElasticsearchService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ElasticIndexPosts extends Command
{
    protected $signature   = 'es:index-posts {--fresh : 기존 인덱스 삭제 후 재생성}';
    protected $description = 'posts 테이블 전체를 Elasticsearch에 인덱싱';

    public function handle(ElasticsearchService $es): int
    {
        if (!$es->isHealthy()) {
            $this->error('Elasticsearch에 연결할 수 없습니다. (host=' . config('elasticsearch.host') . ')');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->warn('기존 인덱스를 삭제하고 재생성합니다...');
            $es->dropIndex();
        }

        $es->createIndex();

        $total = DB::table('posts')->where('post_status', 'ACTIVE')->count();
        $this->info("총 {$total}개 게시물 인덱싱 시작...");

        $bar     = $this->output->createProgressBar($total);
        $indexed = 0;

        $bar->start();

        DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_status', 'ACTIVE')
            ->orderBy('p.post_id')
            ->select([
                'p.post_id', 'p.title', 'p.content', 'p.hits', 'p.comment_count',
                'p.created_at', 'p.post_category', 'p.post_status', 'p.source',
                'u.name as author',
                'b.board_name',
                DB::raw("EXISTS (SELECT 1 FROM files WHERE file_kind = 'POST' AND ref_id = p.post_id) AS has_image"),
            ])
            ->chunk(500, function ($posts) use ($es, $bar, &$indexed) {
                $es->bulkIndex($posts);
                $bar->advance($posts->count());
                $indexed += $posts->count();
            });

        $bar->finish();
        $this->newLine();
        $this->info("완료: {$indexed}개 게시물 인덱싱");

        return self::SUCCESS;
    }
}
