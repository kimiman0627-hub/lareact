<?php

return [

   'post_types' => [
        'NORMAL' => '일반',
    ],

    'post_statuses' => [
        'ACTIVE' => '활성',
        'INACTIVE' => '비활성',
    ],

    'post_categories' => [
        'NOTICE' => '공지',
        'EVENT' => '이벤트',
        'FAQ' => '자주 묻는 질문',
        'FREE' => '자유게시판',
    ],

    'file_kinds' => [
        'BANNER' => '배너',
        'POST'   => '게시물',
    ],

    'banner_types' => [
        'IMAGE'  => '이미지',
        'HTML'   => 'HTML',
        'IFRAME' => 'iframe 임베드',
        'SCRIPT' => '스크립트',
        'VIDEO'  => '동영상 URL',
    ],

    'banner_statuses' => [
        'ACTIVE'   => '활성',
        'INACTIVE' => '비활성',
    ],

    'banner_positions' => [
        'MAIN_TOP'    => '메인 상단',
        'MAIN_BOTTOM' => '메인 하단',
        'SIDE1'       => '사이드1',
        'SIDE2'       => '사이드2',
        'MAIN_BOARD_CATEGORY1'   => '메인 카테고리1',
        'MAIN_BOARD_CATEGORY2'   => '메인 카테고리2',
    ],

    // 게시판 구분 (board_type)
    'board_types' => [
        'NORMAL'    => '일반',
        'SECRET'    => '비밀',
        'ANONYMOUS' => '익명',
    ],

    // 게시판 레이아웃 (board_layout)
    'board_layouts' => [
        'GENERAL' => '일반형',
        'GALLERY' => '갤러리형',
        'PHOTO'   => '포토형',
        'SIMPLE'  => '한줄게시판',
    ],

    // 게시판 상태
    'board_statuses' => [
        'ACTIVE'   => '활성',
        'INACTIVE' => '비활성',
    ],

    // options 기본값 (프론트에 전달용)
    'board_options' => [
        'permissions' => [
            'ALL'    => '전체',
            'MEMBER' => '회원',
            'ADMIN'  => '관리자',
        ],
        'point_cycles' => [
            'ONCE'     => '최초 1회',
            'DAILY'    => '일 1회',
            'PER_POST' => '작성마다',
        ],
    ],
];