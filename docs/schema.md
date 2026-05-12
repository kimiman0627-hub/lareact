# DB 스키마

PostgreSQL 사용. 마이그레이션 파일 기준으로 작성.

---

## 테이블 목록

| 테이블                           | 생성일     | 설명                 |
| -------------------------------- | ---------- | -------------------- |
| users                            | 기본       | 서비스 회원          |
| password_reset_tokens            | 기본       | 비밀번호 재설정 토큰 |
| sessions                         | 기본       | 세션                 |
| cache / cache_locks              | 기본       | Laravel 캐시         |
| jobs / job_batches / failed_jobs | 기본       | Laravel 큐           |
| admins                           | 2026-03-26 | 관리자 계정          |
| posts                            | 2026-04-01 | 게시글               |
| banners                          | 2026-04-06 | 배너                 |
| post_banners                     | 2026-04-06 | 게시글-배너 연결     |
| files                            | 2026-04-06 | 업로드 파일          |
| boards                           | 2026-04-08 | 게시판 설정          |
| crawl_logs                       | 2026-04-12 | 크롤링 실행 이력     |
| inquiries                        | 2026-04-12 | 1:1/제휴 문의        |

---

## users

서비스 일반 회원. 크롤링 더미 계정도 포함.

| 컬럼                    | 타입      | 옵션             | 설명                           |
| ----------------------- | --------- | ---------------- | ------------------------------ |
| id                      | bigint    | PK, auto         |                                |
| name                    | varchar   | NOT NULL         |                                |
| email                   | varchar   | UNIQUE           |                                |
| email_verified_at       | timestamp | nullable         |                                |
| password                | varchar   |                  | bcrypt                         |
| user_role               | varchar   | default: GENERAL | 회원 구분 (GENERAL/TEST/ADMIN) |
| remember_token          | varchar   | nullable         |                                |
| created_at / updated_at | timestamp |                  |                                |

---

## admins

관리자 계정. `auth:admin` Guard 사용.

| 컬럼                    | 타입      | 옵션     | 설명   |
| ----------------------- | --------- | -------- | ------ |
| id                      | bigint    | PK, auto |        |
| name                    | varchar   | NOT NULL |        |
| email                   | varchar   | UNIQUE   |        |
| password                | varchar   |          | bcrypt |
| remember_token          | varchar   | nullable |        |
| created_at / updated_at | timestamp |          |        |

초기 데이터: `php artisan db:seed` (AdminSeeder)

---

## posts

게시글. 크롤링 데이터 포함.

| 컬럼                    | 타입      | 옵션                               | 설명                        |
| ----------------------- | --------- | ---------------------------------- | --------------------------- |
| post_id                 | bigint    | PK, auto                           | 원래 id → 2026-04-06 rename |
| source                  | varchar   | nullable, UNIQUE(source,source_id) | 크롤링 출처 (ex: DOGDRIP)   |
| source_id               | varchar   | nullable                           | 출처 사이트 게시글 ID       |
| user_id                 | bigint    | NOT NULL                           | users.id 논리 FK            |
| post_status             | varchar   |                                    | ACTIVE / INACTIVE           |
| post_type               | varchar   |                                    | 게시글 타입 (ex: NORMAL)    |
| post_category           | varchar   |                                    | boards.category 값 참조     |
| title                   | varchar   |                                    | 제목                        |
| content                 | text      |                                    | HTML 본문                   |
| post_data               | jsonb     | nullable                           | 기타 추가 데이터            |
| hits                    | bigint    | default 0, indexed                 | 조회수                      |
| comment_count           | int       | default 0                          | 댓글 수                     |
| is_notice               | boolean   | default false                      | 공지글 여부                 |
| created_at / updated_at | timestamp |                                    |                             |

- `post_category` 값은 `boards.category` 와 매핑됨 (물리 FK 없음)

---

## banners

광고 배너.

| 컬럼                    | 타입         | 옵션          | 설명                          |
| ----------------------- | ------------ | ------------- | ----------------------------- |
| banner_id               | bigint       | PK, auto      | 원래 id → 2026-04-06 rename   |
| title                   | varchar      | NOT NULL      | 배너 제목                     |
| image_url               | varchar      | NOT NULL      | 이미지 경로                   |
| link_url                | varchar      | nullable      | 클릭 이동 URL                 |
| is_new_tab              | boolean      | default false | 새 탭 여부                    |
| banner_status           | varchar      |               | ACTIVE / INACTIVE             |
| banner_position         | varchar      |               | MAIN_TOP / MAIN_BOTTOM / SIDE |
| sort_order              | int unsigned | default 0     | 정렬 순서                     |
| start_date              | date         | nullable      | 노출 시작일                   |
| end_date                | date         | nullable      | 노출 종료일                   |
| created_at / updated_at | timestamp    |               |                               |

---

## banner_daily_stats

배너 일별 노출/클릭 집계. 배너가 렌더링될 때 노출 기록, IMAGE 타입 클릭 시 클릭 기록.

| 컬럼                    | 타입      | 옵션                         | 설명                   |
| ----------------------- | --------- | ---------------------------- | ---------------------- |
| id                      | bigint    | PK, auto                     |                        |
| banner_id               | bigint    | UNIQUE(banner_id, stat_date) | banners.banner_id 참조 |
| stat_date               | date      |                              | 집계 날짜              |
| impressions             | bigint    | default 0                    | 노출 수                |
| clicks                  | bigint    | default 0                    | 클릭 수                |
| created_at / updated_at | timestamp |                              |                        |

---

## post_banners

게시글-배너 M:N 연결 테이블.

| 컬럼                    | 타입         | 옵션                       | 설명                       |
| ----------------------- | ------------ | -------------------------- | -------------------------- |
| post_banner_id          | bigint       | PK, auto                   |                            |
| post_id                 | bigint       | UNIQUE(post_id, banner_id) | 논리 FK: posts.post_id     |
| banner_id               | bigint       |                            | 논리 FK: banners.banner_id |
| sort_order              | int unsigned | default 0                  |                            |
| created_at / updated_at | timestamp    |                            |                            |

---

## files

업로드 파일 메타데이터. `storage/app/public/uploads/` 에 실제 파일 저장.

| 컬럼                    | 타입      | 옵션      | 설명                                          |
| ----------------------- | --------- | --------- | --------------------------------------------- |
| file_id                 | bigint    | PK, auto  |                                               |
| file_kind               | varchar   |           | BANNER / POST                                 |
| ref_id                  | bigint    | nullable  | 연결 레코드 ID (banner_id, post_id 등)        |
| original_name           | varchar   |           | 원본 파일명                                   |
| stored_name             | varchar   |           | 저장 파일명 (UUID.ext)                        |
| file_path               | varchar   |           | storage 기준 상대 경로 (`public/uploads/...`) |
| file_url                | varchar   |           | 퍼블릭 접근 URL (`/storage/uploads/...`)      |
| mime_type               | varchar   | nullable  |                                               |
| file_size               | bigint    | default 0 | 바이트 단위                                   |
| created_at / updated_at | timestamp |           |                                               |

저장 경로 패턴:

- 게시글 이미지: `uploads/post/{post_id}/{uuid}.jpg`
- 배너 이미지: `uploads/banner/{banner_id}/{uuid}.jpg`

---

## comments

게시글 댓글.

| 컬럼                    | 타입      | 옵션              | 설명               |
| ----------------------- | --------- | ----------------- | ------------------ |
| comment_id              | bigint    | PK, auto          |                    |
| post_id                 | bigint    | NOT NULL, indexed | posts.post_id 참조 |
| user_id                 | bigint    | NOT NULL          | users.id 참조      |
| content                 | text      | NOT NULL          | 댓글 내용          |
| created_at / updated_at | timestamp |                   |                    |

---

## boards

게시판 설정. `posts.post_category` 의 실제 목록 소스.

| 컬럼                    | 타입         | 옵션                      | 설명                               |
| ----------------------- | ------------ | ------------------------- | ---------------------------------- |
| board_id                | bigint       | PK, auto                  |                                    |
| board_name              | varchar(100) | NOT NULL                  | 게시판 표시명                      |
| board_order             | int          | default 0, indexed        | 정렬 순서                          |
| board_type              | varchar(20)  | default 'NORMAL'          | NORMAL / SECRET / ANONYMOUS        |
| board_layout            | varchar(20)  | default 'GENERAL'         | GENERAL / GALLERY / PHOTO / SIMPLE |
| board_status            | varchar(20)  | default 'ACTIVE', indexed | ACTIVE / INACTIVE                  |
| category                | varchar(50)  | UNIQUE                    | posts.post_category 매핑 키        |
| options                 | jsonb        | nullable                  | 게시판 세부 설정 (아래 참조)       |
| created_at / updated_at | timestamp    |                           |                                    |

### options jsonb 구조

```json
{
    "read_permission": "ALL", // ALL | MEMBER | ADMIN
    "write_permission": "MEMBER", // ALL | MEMBER | ADMIN
    "comment_enabled": true,
    "comment_permission": "MEMBER", // ALL | MEMBER | ADMIN
    "allow_anonymous": false,
    "point_enabled": false,
    "point_amount": 0,
    "point_cycle": "ONCE", // ONCE | DAILY | PER_POST
    "file_upload": true,
    "file_size_limit": 10, // MB
    "posts_per_page": 20,
    "use_like": true,
    "use_dislike": false,
    "thumbnail_enabled": true,
    "notice_count": 3
}
```

---

## crawl_logs

크롤링 실행 이력. `php artisan crawl:*` 명령 실행 시 자동 기록.

| 컬럼                    | 타입         | 옵션             | 설명                                                    |
| ----------------------- | ------------ | ---------------- | ------------------------------------------------------- |
| id                      | bigint       | PK, auto         |                                                         |
| source                  | varchar(50)  | indexed          | 크롤링 소스 (DCINSIDE, DOGDRIP, ETOLAND, THEQOO, FOMOS) |
| command                 | varchar(100) |                  | artisan 커맨드명 (crawl:dcinside 등)                    |
| status                  | varchar(20)  | default: RUNNING | RUNNING / DONE / FAILED                                 |
| total_found             | int unsigned | default 0        | 목록에서 발견된 게시글 수                               |
| total_saved             | int unsigned | default 0        | DB에 저장된 신규 게시글 수                              |
| total_skipped           | int unsigned | default 0        | 이미 존재해서 스킵된 수                                 |
| total_errors            | int unsigned | default 0        | 에러 발생 횟수                                          |
| error_log               | jsonb        | nullable         | 에러 상세 [{message, time}, ...] 최대 200건             |
| started_at              | timestamp    |                  | 크롤링 시작 시각                                        |
| finished_at             | timestamp    | nullable         | 크롤링 종료 시각 (RUNNING 중이면 null)                  |
| created_at / updated_at | timestamp    |                  |                                                         |

---

## inquiries

1:1 문의 및 제휴 문의.

| 컬럼                    | 타입         | 옵션                      | 설명                        |
| ----------------------- | ------------ | ------------------------- | --------------------------- |
| id                      | bigint       | PK, auto                  |                             |
| type                    | varchar(20)  | default: SUPPORT, indexed | SUPPORT / PARTNERSHIP       |
| user_id                 | bigint       | nullable                  | 로그인 유저면 연결          |
| name                    | varchar(100) | NOT NULL                  | 문의자 이름                 |
| email                   | varchar(255) | NOT NULL                  | 문의자 이메일               |
| phone                   | varchar(30)  | nullable                  | 연락처                      |
| title                   | varchar(200) | NOT NULL                  | 문의 제목                   |
| content                 | text         | NOT NULL                  | 문의 내용                   |
| status                  | varchar(20)  | default: PENDING, indexed | PENDING / ANSWERED / CLOSED |
| answer                  | text         | nullable                  | 관리자 답변                 |
| answered_at             | timestamp    | nullable                  | 답변 일시                   |
| created_at / updated_at | timestamp    |                           |                             |
