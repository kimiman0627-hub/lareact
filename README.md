# 커뮤니티 포털 (Laravel + React)

광고 클릭을 통해 게시글을 열람하는 커뮤니티 포털 서비스. (개인 프로젝트)

---

## 기술 스택

- **백엔드**: Laravel (PHP)
- **프론트엔드**: React + Tailwind CSS
- **빌드 도구**: Vite
- **DB**: PostgreSQL

---

## 핵심 기능

- 커뮤니티 게시판 (목록/작성/댓글)
- 광고 게이트 — 게시글 열람 전 광고 클릭 유도
- 크롤링 자동화
- Google Blogger 자동 발행
- 로또 당첨번호 조회
- AI 게시글 요약 (Claude API)
- 관리자 페이지

---

## 로컬 개발 환경 설정

```bash
# 의존성 설치
composer install
npm install

# 환경변수 설정
cp .env.example .env
php artisan key:generate

# DB 마이그레이션 및 시더
php artisan migrate
php artisan db:seed

# 개발 서버 실행
php artisan serve   # Laravel 백엔드 (http://localhost:8000)
npm run dev         # Vite + React 프론트
```

---

## 주요 명령어

```bash
# 크롤링
php artisan crawl:dogdrip
php artisan crawl:dcinside
php artisan crawl:etoland
php artisan crawl:fomos
php artisan crawl:bobaedream

# AI 요약
php artisan posts:summarize --limit=20

# Google Blogger 발행
php artisan blogger:publish --dry-run   # 대상 확인
php artisan blogger:publish --force     # 강제 실행

# Threads 발행
php artisan threads:publish --dry-run
php artisan threads:publish --force

# 로또 동기화
php artisan lotto:sync

# 캐시 초기화
php artisan config:clear && php artisan cache:clear && php artisan route:clear

# 테스트
php artisan test
```

---

## 프로젝트 문서

- [DB 스키마](docs/schema.md)
- [API 목록](docs/api.md)
