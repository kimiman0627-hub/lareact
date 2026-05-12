<?php

return [

   'menu' => [
        [
            'title' => '대시보드',
            'icon' => 'fa-solid fa-tachometer-alt',
            'route' => 'admin.index',
            
        ],
        [
            'title' => '유저 관리',
            'icon' => 'fa-solid fa-users',
            'route' => 'admin.users.index',
            'submenu' => [
                [
                    'title' => '유저 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.users.index',
                ],
            ],
        ],
        [
            'title' => '게시글 관리',
            'icon' => 'fa-solid fa-file-alt',
            'route' => 'admin.posts.index',
            'submenu' => [
                [
                    'title' => '게시글 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.posts.index',
                ],
                [
                    'title' => '댓글 목록',
                    'icon' => 'fa-solid fa-comments',
                    'route' => 'admin.comments.index',
                ],
                [
                    'title' => '좋아요/싫어요 내역',
                    'icon' => 'fa-solid fa-thumbs-up',
                    'route' => 'admin.likes.index',
                ],
                [
                    'title' => '스크랩 내역',
                    'icon' => 'fa-solid fa-bookmark',
                    'route' => 'admin.scraps.index',
                ],
                [
                    'title' => '게시판 설정',
                    'icon' => 'fa-solid fa-sliders',
                    'route' => 'admin.boards.index',
                ],
                
            ],
        ],
        [
            'title' => '배너 관리',
            'icon' => 'fa-solid fa-image',
            'route' => 'admin.banners.index',
            'submenu' => [
                [
                    'title' => '배너 관리',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.banners.index',
                ],
            ],
        ],
        [
            'title' => '문의/신고',
            'icon' => 'fa-solid fa-envelope',
            'route' => 'admin.inquiries.index',
            'submenu' => [
                [
                    'title' => '문의 목록',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.inquiries.index',
                ],
                [
                    'title' => '신고 목록',
                    'icon' => 'fa-solid fa-flag',
                    'route' => 'admin.reports.index',
                ],
            ],
        ],
        [
            'title'      => '관리자 관리',
            'icon'       => 'fa-solid fa-user-shield',
            'route'      => 'admin.admins.index',
            'super_only' => true,
            'submenu'    => [
                [
                    'title' => '관리자 목록',
                    'icon'  => 'fa-solid fa-list',
                    'route' => 'admin.admins.index',
                ],
            ],
        ],
        [
            'title' => '사이트 설정',
            'icon' => 'fa-solid fa-gear',
            'route' => 'admin.settings.site',
            'submenu' => [
                [
                    'title' => '코드 삽입 설정',
                    'icon'  => 'fa-solid fa-code',
                    'route' => 'admin.settings.site',
                ],
                [
                    'title' => '메뉴 설정',
                    'icon'  => 'fa-solid fa-bars',
                    'route' => 'admin.settings.menu',
                ],
                [
                    'title' => 'API 키 관리',
                    'icon'  => 'fa-solid fa-key',
                    'route' => 'admin.settings.api-keys',
                ],
            ],
        ],
        [
            'title' => '통계',
            'icon' => 'fa-solid fa-chart-line',
            'route' => 'admin.stats.users',
            'submenu' => [
                [
                    'title' => '가입/로그인 통계',
                    'icon' => 'fa-solid fa-users',
                    'route' => 'admin.stats.users',
                ],
                [
                    'title' => '배너 통계',
                    'icon' => 'fa-solid fa-rectangle-ad',
                    'route' => 'admin.stats.banners',
                ],
            ],
        ],
        [
            'title' => '로그',
            'icon' => 'fa-solid fa-spider',
            'route' => 'admin.crawl-logs.index',
            'submenu' => [
                [
                    'title' => '크롤링 로그',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.crawl-logs.index',
                ],
                [
                    'title' => 'Blogger 발행 로그',
                    'icon'  => 'fa-solid fa-rss',
                    'route' => 'admin.blogger.logs',
                ],
            ],
        ],
    ],

];