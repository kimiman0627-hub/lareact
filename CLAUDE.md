# 프로젝트 개요

Laravel + React 풀스택 프로젝트 (개인 개발 연습용)

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
├── web.php              # 일반 라우트
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
│   ├── Service/         # 서비스 React 컴포넌트
│   └── Utils/           # 공통 유틸리티
├── css/
│   ├── app.css          # 서비스 스타일
│   └── admin.css        # 관리자 스타일
└── views/
    ├── app.blade.php    # 서비스 Blade 템플릿
    └── admin.blade.php  # 관리자 Blade 템플릿
```

### DB 마이그레이션 현황

- users (기본)
- admins (2026-03-26)
- posts / post_id rename (2026-04-01 ~ 04-06)
- banners / banner_id rename (2026-04-06)
- post_banners (2026-04-06)
- files (2026-04-06)

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
```

---

## 코딩 규칙

- PHP: Laravel 컨벤션 준수, 비즈니스 로직은 app/Lib/ 에 분리
- React: 함수형 컴포넌트 + Hooks 사용
- 스타일: Tailwind CSS 유틸리티 클래스 사용
- 라우트: 관리자는 routes/admin.php, 일반은 routes/web.php 분리

## 작업 규칙

- 파일 수정 전 반드시 해당 파일만 읽을 것
- 여러 파일 수정 시 하나씩 확인 후 진행
- node_modules, vendor 내부 파일 절대 참조 금지
