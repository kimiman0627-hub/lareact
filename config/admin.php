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
            'title' => '로그',
            'icon' => 'fa-solid fa-spider',
            'route' => 'admin.crawl-logs.index',
            'submenu' => [
                [
                    'title' => '크롤링 로그',
                    'icon' => 'fa-solid fa-list',
                    'route' => 'admin.crawl-logs.index',
                ],
            ],
        ],
    ],

];