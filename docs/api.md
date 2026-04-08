# API 엔드포인트 목록

모든 관리자 API는 `/admin` 접두사. 미들웨어: `auth:admin`.

---

## 인증

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/admin/login` | 로그인 페이지 |
| POST | `/admin/login` | 로그인 처리 |
| POST | `/admin/logout` | 로그아웃 |

---

## 대시보드

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| GET | `/admin` | `admin.index` | 대시보드 |

---

## 유저 관리

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| GET | `/admin/users` | `admin.users.index` | 목록 (Inertia) |
| GET | `/admin/users/search` | `admin.admin.users.search` | 자동완성 검색 (JSON) |
| POST | `/admin/users` | `admin.users.store` | 생성 |
| PUT/PATCH | `/admin/users/{user}` | `admin.users.update` | 수정 |
| DELETE | `/admin/users/{user}` | `admin.users.destroy` | 삭제 |

### GET /admin/users/search

쿼리 파라미터: `keyword` (이름 또는 이메일 부분 검색)

응답:
```json
{ "success": true, "data": [{ "id": 1, "name": "...", "email": "..." }] }
```

---

## 게시글 관리

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| GET | `/admin/posts` | `admin.posts.index` | 목록 (Inertia) |
| POST | `/admin/posts` | `admin.posts.store` | 생성 |
| PUT/PATCH | `/admin/posts/{post}` | `admin.posts.update` | 수정 |
| DELETE | `/admin/posts/{post}` | `admin.posts.destroy` | 삭제 |

### GET /admin/posts 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|---|---|---|
| id | string | post_id 검색 |
| name | string | 작성자 이름 (ILIKE) |
| email | string | 작성자 이메일 (ILIKE) |
| keyword | string | 검색어 |
| search_type | enum | title / content / all |
| start_date | date | 작성일 시작 |
| end_date | date | 작성일 종료 |
| post_status | enum | ACTIVE / INACTIVE |
| post_type | enum | config 기준 |
| post_category | string | boards.category 값 |
| page | int | 페이지 번호 |
| per_page | int | 페이지당 건수 (기본 20) |

### POST/PUT /admin/posts 요청 바디

| 필드 | 필수 | 설명 |
|---|---|---|
| user_id | ✓ | users.id |
| post_status | ✓ | ACTIVE / INACTIVE |
| post_type | ✓ | config.post_types 키 |
| post_category | ✓ | boards.category 값 |
| title | ✓ | 제목 (max 255) |
| content | ✓ | HTML 본문 |
| is_notice | ✓ | boolean |
| created_at | | datetime |
| banner_ids | | int[] 배너 ID 배열 |

---

## 게시판 설정

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| GET | `/admin/boards` | `admin.boards.index` | 목록 (Inertia) |
| POST | `/admin/boards` | `admin.boards.store` | 생성 |
| PUT/PATCH | `/admin/boards/{board}` | `admin.boards.update` | 수정 |
| DELETE | `/admin/boards/{board}` | `admin.boards.destroy` | 삭제 |

### POST/PUT /admin/boards 요청 바디

| 필드 | 필수 | 설명 |
|---|---|---|
| board_name | ✓ | 게시판명 (max 100) |
| board_order | ✓ | 정렬 순서 (int, min 0) |
| board_type | ✓ | NORMAL / SECRET / ANONYMOUS |
| board_layout | ✓ | general / gallery / photo / simple |
| board_status | ✓ | ACTIVE / INACTIVE |
| category | ✓ | 영문/숫자/언더바 (unique) |
| options | | jsonb 설정 객체 (schema.md 참조) |

---

## 배너 관리

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| GET | `/admin/banners` | `admin.banners.index` | 목록 (Inertia) |
| POST | `/admin/banners` | `admin.banners.store` | 생성 |
| PUT/PATCH | `/admin/banners/{banner}` | `admin.banners.update` | 수정 |
| DELETE | `/admin/banners/{banner}` | `admin.banners.destroy` | 삭제 |
| PATCH | `/admin/banners/{banner}/order` | `admin.banners.order` | 순서 변경 |

---

## 파일 업로드

| 메서드 | 경로 | 라우트명 | 설명 |
|---|---|---|---|
| POST | `/admin/files/upload` | `admin.files.upload` | 단일 파일 업로드 |

### POST /admin/files/upload

`multipart/form-data`

| 필드 | 설명 |
|---|---|
| file | 이미지 파일 (jpeg/png/gif/webp) |
| file_kind | POST / BANNER |
| ref_id | 연결할 레코드 ID (optional) |

응답:
```json
{
  "success": true,
  "data": {
    "file_id": 1,
    "file_url": "/storage/uploads/post/123/uuid.jpg",
    "original_name": "image.jpg"
  }
}
```

---

## 공통 응답 형식

성공 (Inertia 페이지 전환):
- `redirect()->route(...)->with('message', '...')`

에러:
```json
{ "message": "에러 메시지", "code": 500 }
```
