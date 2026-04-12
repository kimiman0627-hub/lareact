<?php

namespace App\Models\Crawl;

use Illuminate\Database\Eloquent\Model;

class CrawlLog extends Model
{
    protected $fillable = [
        'source',
        'command',
        'status',
        'total_found',
        'total_saved',
        'total_skipped',
        'total_errors',
        'error_log',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'error_log'   => 'array',
        'started_at'  => 'datetime',
        'finished_at' => 'datetime',
    ];
}
