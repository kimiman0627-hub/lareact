<?php

return [

   'menu' => [
        [
            'label' => '대시보드',
            'icon' => 'fa-solid fa-tachometer-alt',
            'route' => 'admin.index',
            
        ],
        [
            'label' => '유저 관리',
            'icon' => 'fa-solid fa-users',
            'route' => 'admin.users.index',
            'submenu' => [
                [
                    'label' => '유저 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.users.index',
                ],
            ],
        ],
        [
            'label' => '게시글 관리',
            'icon' => 'fa-solid fa-file-alt',
            'route' => 'admin.posts.index',
            'submenu' => [
                [
                    'label' => '게시글 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.posts.index',
                ],
                [
                    'label' => '댓글 목록',
                    'icon' => 'fa-solid fa-comments',
                    'route' => 'admin.comments.index',
                ],
                [
                    'label' => '좋아요/싫어요 내역',
                    'icon' => 'fa-solid fa-thumbs-up',
                    'route' => 'admin.likes.index',
                ],
                [
                    'label' => '스크랩 내역',
                    'icon' => 'fa-solid fa-bookmark',
                    'route' => 'admin.scraps.index',
                ],
                [
                    'label' => '게시판 설정',
                    'icon' => 'fa-solid fa-sliders',
                    'route' => 'admin.boards.index',
                ],
                
            ],
        ],
        [
            'label' => '배너 관리',
            'icon' => 'fa-solid fa-image',
            'route' => 'admin.banners.index',
            'submenu' => [
                [
                    'label' => '배너 관리',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.banners.index',
                ],
            ],
        ],
        [
            'label' => '문의/신고',
            'icon' => 'fa-solid fa-envelope',
            'route' => 'admin.inquiries.index',
            'submenu' => [
                [
                    'label' => '문의 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.inquiries.index',
                ],
                [
                    'label' => '신고 목록',
                    'icon' => 'fa-solid fa-flag',
                    'route' => 'admin.reports.index',
                ],
            ],
        ],
        [
            'label'      => '관리자 관리',
            'icon'       => 'fa-solid fa-user-shield',
            'route'      => 'admin.admins.index',
            'super_only' => true,
            'submenu'    => [
                [
                    'label' => '관리자 목록',
                    'icon'  => 'fa-solid fa-list',
                    'route' => 'admin.admins.index',
                ],
            ],
        ],
        [
            'label' => '사이트 설정',
            'icon' => 'fa-solid fa-gear',
            'route' => 'admin.settings.site',
            'submenu' => [
                [
                    'label' => '코드 삽입 설정',
                    'icon'  => 'fa-solid fa-code',
                    'route' => 'admin.settings.site',
                ],
                [
                    'label' => '메뉴 설정',
                    'icon'  => 'fa-solid fa-bars',
                    'route' => 'admin.settings.menu',
                ],
                [
                    'label' => 'API 키 관리',
                    'icon'  => 'fa-solid fa-key',
                    'route' => 'admin.settings.api-keys',
                ],
            ],
        ],
        [
            'label' => '통계',
            'icon' => 'fa-solid fa-chart-line',
            'route' => 'admin.stats.users',
            'submenu' => [
                [
                    'label' => '가입/로그인 통계',
                    'icon' => 'fa-solid fa-users',
                    'route' => 'admin.stats.users',
                ],
                [
                    'label' => '배너 통계',
                    'icon' => 'fa-solid fa-rectangle-ad',
                    'route' => 'admin.stats.banners',
                ],
            ],
        ],
        [
            'label' => '로그',
            'icon' => 'fa-solid fa-spider',
            'route' => 'admin.crawl-logs.index',
            'submenu' => [
                [
                    'label' => '크롤링 로그',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.crawl-logs.index',
                ],
                [
                    'label' => 'Blogger 발행 로그',
                    'icon'  => 'fa-solid fa-rss',
                    'route' => 'admin.blogger.logs',
                ],
                [
                    'label' => 'Threads 발행 로그',
                    'icon'  => 'fa-brands fa-threads',
                    'route' => 'admin.threads.logs',
                ],
            ],
        ],
    ],

];