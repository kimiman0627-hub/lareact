<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // 네이버 클라우드 Object Storage (S3 호환 API)
        'ncp' => [
            'driver'                  => 's3',
            'key'                     => env('NCP_STORAGE_ACCESS_KEY'),
            'secret'                  => env('NCP_STORAGE_SECRET_KEY'),
            'region'                  => env('NCP_STORAGE_REGION', 'kr-standard'),
            'bucket'                  => env('NCP_STORAGE_BUCKET'),
            'endpoint'                => env('NCP_STORAGE_ENDPOINT', 'https://kr.object.ncloudstorage.com'),
            'use_path_style_endpoint' => true,
            'throw'                   => false,
            'report'                  => false,
        ],

        // Cloudflare R2 비공개 버킷 (S3 호환 API, /file/... 프록시로 서빙)
        // - R2 는 객체 ACL 미지원 → visibility 지정 금지
        // - AWS SDK 기본 체크섬 헤더를 R2 가 거부할 수 있어 필요할 때만 사용
        'r2' => [
            'driver'                       => 's3',
            'key'                          => env('R2_ACCESS_KEY_ID'),
            'secret'                       => env('R2_SECRET_ACCESS_KEY'),
            'region'                       => 'auto',
            'bucket'                       => env('R2_BUCKET'),
            'endpoint'                     => env('R2_ENDPOINT'),
            'use_path_style_endpoint'      => true,
            'request_checksum_calculation' => 'when_required',
            'response_checksum_validation' => 'when_required',
            'throw'                        => false,
            'report'                       => false,
        ],

        // Cloudflare R2 공개 버킷 (Blogger 등 외부 노출용, 커스텀 도메인 연결)
        'r2_public' => [
            'driver'                       => 's3',
            'key'                          => env('R2_ACCESS_KEY_ID'),
            'secret'                       => env('R2_SECRET_ACCESS_KEY'),
            'region'                       => 'auto',
            'bucket'                       => env('R2_PUBLIC_BUCKET'),
            'endpoint'                     => env('R2_ENDPOINT'),
            'url'                          => env('R2_PUBLIC_URL'),
            'use_path_style_endpoint'      => true,
            'request_checksum_calculation' => 'when_required',
            'response_checksum_validation' => 'when_required',
            'throw'                        => false,
            'report'                       => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

    // 파일 저장소 종류: LOCAL | NCP | R2 (.env FILE_STORAGE 값으로 제어, App\Lib\Common\FileStorage 참고)
    'file_storage' => env('FILE_STORAGE', 'LOCAL'),

    // NCP 공개 파일 CDN 주소 (Blogger 발행 이미지용)
    'ncp_cdn_url' => env('NCP_CDN_URL', ''),

];
