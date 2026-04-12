## 서비스 개요

**서비스명**: (미정 — 예: CommGate, ViewPass 등)

**한 줄 설명**: 쿠팡파트너스, 알리익스프레스 등 광고 클릭을 통해 게시글을 열람하는 커뮤니티 포털

**목적**: 개인 개발 연습용 풀스택 프로젝트. 커뮤니티 기능과 광고 수익 모델을 결합한 서비스 구현을 목표로 함.

**타겟 유저**: 다양한 주제의 게시글을 읽고 쓰는 일반 사용자

---

## 핵심 기능

### 커뮤니티 게시판

- 게시글 목록 조회 (누구나 가능)
- 게시글 작성 (회원 전용)
- 게시글 열람 → **광고 게이트 통과 후 가능**
- 댓글 작성 및 조회

### 광고 게이트 (Ad Gate) — 핵심 비즈니스 로직

게시글 상세 열람 전에 쿠팡파트너스 광고 배너를 노출하고, 사용자가 링크를 클릭한 후 돌아오면 게시글을 열람할 수 있도록 하는 흐름.

**플로우**:

```
게시글 클릭
  → 광고 게이트 페이지 노출 (쿠팡파트너스 배너)
    → 사용자가 광고 링크 클릭 (외부 이동)
      → 사이트로 복귀
        → 게시글 열람 허용
```

**열람권 처리 방식** (구현 예정):

- 광고 클릭 시 서버에 클릭 이벤트 기록
- 세션 또는 쿠키 기반으로 열람 허용 상태 유지
- 동일 게시글 재열람 시 일정 시간(예: 24시간) 동안 광고 생략 가능

# 프로젝트 개요

Laravel + React 풀스택 프로젝트

- 백엔드: Laravel (PHP)
- 프론트엔드: React (JSX) + Tailwind CSS
- 빌드도구: Vite
- DB: PostgreSQL

---

## 절대 읽지 말 것 (토큰 낭비 방지)

- node_modules/
- vendor/
- public/build/
- storage/
- bootstrap/cache/

- .env

- composer.lock
- package-lock.json

---

## 작업 후 업데이트 규칙

작업 완료 후 아래 항목이 변경됐다면 해당 섹션을 업데이트할 것:

- 테이블 추가/수정 → `docs/schema.md` 의 스키마 현황 갱신
- 새 페이지/라우트 추가 → 프로젝트 구조 섹션 갱신
- 새 명령어 생기면 → 주요 명령어 섹션 갱신
- 도메인 용어 새로 생기면 → 도메인 용어 섹션 갱신

## 프로젝트 구조

### 백엔드 (Laravel)

```
app/
├── Http/
│   ├── Controllers/     # 컨트롤러
│   └── Middleware/      # 미들웨어
├── Lib/
│   ├── Banner/          # 배너 비즈니스 로직
│   ├── Board/           # 게시판 비즈니스 로직
│   ├── Common/          # 공통 로직
│   └── User/            # 유저 비즈니스 로직
├── Models/
│   ├── Admin/           # 관리자 모델
│   ├── Banner/          # 배너 모델
│   ├── Board/           # 게시판 모델
│   ├── File/            # 파일 모델
│   └── User/            # 유저 모델
routes/
├── web.php              # 일반 라우트 (/, /board/{category}, /post/{id})
├── admin.php            # 관리자 라우트
└── console.php
config/
├── config.php           # 커스텀 설정
├── admin.php            # 관리자 설정
└── ...기타 Laravel 기본 설정
```

### 프론트엔드 (React)

```
resources/
├── js/
│   ├── admin.jsx        # 관리자 앱 엔트리포인트
│   ├── service.jsx      # 서비스 앱 엔트리포인트
│   ├── Admin/           # 관리자 React 컴포넌트
│   ├── Service/
│   │   ├── Pages/Main/Index.jsx       # 메인페이지
│   │   ├── Pages/Board/BoardList.jsx  # 게시판 목록 (/board/{category})
│   │   ├── Pages/Board/PostDetail.jsx # 게시글 상세 (/post/{id})
│   │   ├── Pages/User/MyPage.jsx      # 마이페이지 (/mypage?tab=posts|comments)
│   │   └── ...기타 컴포넌트/레이아웃
│   └── Utils/           # 공통 유틸리티
├── css/
│   ├── app.css          # 서비스 스타일
│   └── admin.css        # 관리자 스타일
└── views/
    ├── app.blade.php    # 서비스 Blade 템플릿
    └── admin.blade.php  # 관리자 Blade 템플릿
```

### 상세 문서

- DB 스키마: docs/schema.md 참고
- API 목록: docs/api.md 참고

---

## 주요 명령어

```bash
# 개발 서버
php artisan serve          # Laravel 백엔드
npm run dev                # Vite + React 프론트

# DB
php artisan migrate        # 마이그레이션 실행
php artisan migrate:fresh  # DB 초기화 후 재실행
php artisan db:seed        # 시더 실행 (AdminSeeder 포함)

# 테스트
php artisan test

# 캐시 초기화
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# 크롤링
php artisan crawl:dogdrip   # 개드립(dogdrip.net) 크롤링
php artisan crawl:dcinside  # DCInside 크롤링
php artisan crawl:etoland   # 이토랜드(etoland.co.kr) 크롤링
```

---

## 코딩 규칙

- PHP: Laravel 컨벤션 준수, 비즈니스 로직은 app/Lib/ 에 분리
- React: 함수형 컴포넌트 + Hooks 사용
- 스타일: Tailwind CSS 유틸리티 클래스 사용
- 라우트: 관리자는 routes/admin.php, 일반은 routes/web.php 분리

### Enum / 상태값 명명 규칙

`config/config.php` 및 DB 컬럼에 저장되는 모든 enum성 값은 **대문자 스네이크 케이스(UPPER_SNAKE_CASE)** 로 통일한다.

```php
// ✅ 올바른 예
'ACTIVE', 'INACTIVE', 'NORMAL', 'GENERAL', 'GALLERY', 'MAIN_TOP', 'PER_POST'

// ❌ 잘못된 예
'active', 'general', 'main_top', 'perPost'
```

적용 범위:
- `config/config.php` 의 모든 키 (post_statuses, board_layouts, banner_positions 등)
- DB 컬럼에 저장되는 상태값 (post_status, board_layout, board_type 등)
- 마이그레이션 `default()` 값
- React 컴포넌트의 초기값 / 배지 매핑 키
- 컨트롤러 `in:` 유효성 검사는 `implode(',', array_keys(config(...)))` 로 config에서 동적으로 읽어 하드코딩 금지

## 작업 규칙

- 파일 수정 전 반드시 해당 파일만 읽을 것
- 여러 파일 수정 시 하나씩 확인 후 진행
- node_modules, vendor 내부 파일 절대 참조 금지
