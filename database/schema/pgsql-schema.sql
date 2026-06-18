--
-- PostgreSQL database dump
--

\restrict u1IYcby7hmDu2EQ72e9ElxS18gkVKaOmhYcdjKWPwtQBj9AcvX6wXorYXi2BKYH

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: tsm_system_rows; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tsm_system_rows WITH SCHEMA public;


--
-- Name: EXTENSION tsm_system_rows; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION tsm_system_rows IS 'TABLESAMPLE method which accepts number of rows as a limit';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_super boolean DEFAULT false NOT NULL,
    menu_permissions json
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: banner_daily_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banner_daily_stats (
    id bigint NOT NULL,
    banner_id bigint NOT NULL,
    stat_date date NOT NULL,
    impressions bigint DEFAULT '0'::bigint NOT NULL,
    clicks bigint DEFAULT '0'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: banner_daily_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banner_daily_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banner_daily_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banner_daily_stats_id_seq OWNED BY public.banner_daily_stats.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    banner_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    title character varying(255) NOT NULL,
    image_url character varying(255),
    link_url character varying(255),
    is_new_tab boolean DEFAULT false NOT NULL,
    banner_status character varying(255) NOT NULL,
    banner_position character varying(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    start_date date,
    end_date date,
    banner_type character varying(255) DEFAULT 'IMAGE'::character varying NOT NULL,
    content text
);


--
-- Name: COLUMN banners.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.title IS '배너 제목';


--
-- Name: COLUMN banners.link_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.link_url IS '클릭 시 이동 URL';


--
-- Name: COLUMN banners.is_new_tab; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.is_new_tab IS '새 탭 열기 여부';


--
-- Name: COLUMN banners.banner_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.banner_status IS '배너 상태 ACTIVE/INACTIVE';


--
-- Name: COLUMN banners.banner_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.banner_position IS '배너 위치 MAIN_TOP, MAIN_BOTTOM, SIDE';


--
-- Name: COLUMN banners.sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.sort_order IS '정렬 순서';


--
-- Name: COLUMN banners.start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.start_date IS '노출 시작일';


--
-- Name: COLUMN banners.end_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.end_date IS '노출 종료일';


--
-- Name: COLUMN banners.banner_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.banner_type IS '배너 타입 IMAGE/HTML/IFRAME/SCRIPT/VIDEO';


--
-- Name: COLUMN banners.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.content IS 'HTML/iframe/script/video 콘텐츠 (IMAGE 타입 외)';


--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banners_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.banner_id;


--
-- Name: blogger_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blogger_logs (
    id bigint NOT NULL,
    post_id bigint,
    post_title character varying(255) NOT NULL,
    hits bigint DEFAULT '0'::bigint NOT NULL,
    source character varying(255),
    blogger_post_id character varying(255),
    blogger_url character varying(500),
    status character varying(255) NOT NULL,
    message text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: blogger_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blogger_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blogger_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blogger_logs_id_seq OWNED BY public.blogger_logs.id;


--
-- Name: boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boards (
    board_id bigint NOT NULL,
    board_name character varying(100) NOT NULL,
    board_order integer DEFAULT 0 NOT NULL,
    board_type character varying(20) DEFAULT 'NORMAL'::character varying NOT NULL,
    board_layout character varying(20) DEFAULT 'general'::character varying NOT NULL,
    board_status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    category character varying(50) NOT NULL,
    options jsonb,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: COLUMN boards.board_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.board_name IS '게시판명';


--
-- Name: COLUMN boards.board_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.board_order IS '정렬 순서';


--
-- Name: COLUMN boards.board_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.board_type IS '게시판 구분: NORMAL, SECRET, ANONYMOUS';


--
-- Name: COLUMN boards.board_layout; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.board_layout IS '게시판 타입: general, gallery, photo, simple';


--
-- Name: COLUMN boards.board_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.board_status IS '상태: ACTIVE, INACTIVE';


--
-- Name: COLUMN boards.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.category IS 'posts.post_category 매핑값';


--
-- Name: COLUMN boards.options; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boards.options IS '게시판 세부 설정';


--
-- Name: boards_board_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.boards_board_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: boards_board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.boards_board_id_seq OWNED BY public.boards.board_id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    comment_id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    parent_id bigint,
    depth smallint DEFAULT '1'::smallint NOT NULL
);


--
-- Name: comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_comment_id_seq OWNED BY public.comments.comment_id;


--
-- Name: crawl_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crawl_logs (
    id bigint NOT NULL,
    source character varying(50) NOT NULL,
    command character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'RUNNING'::character varying NOT NULL,
    total_found integer DEFAULT 0 NOT NULL,
    total_saved integer DEFAULT 0 NOT NULL,
    total_skipped integer DEFAULT 0 NOT NULL,
    total_errors integer DEFAULT 0 NOT NULL,
    error_log jsonb,
    started_at timestamp(0) without time zone NOT NULL,
    finished_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: crawl_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crawl_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crawl_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crawl_logs_id_seq OWNED BY public.crawl_logs.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    file_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    file_kind character varying(255) NOT NULL,
    ref_id bigint,
    original_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    mime_type character varying(255),
    file_size bigint DEFAULT '0'::bigint NOT NULL,
    storage character varying(20) DEFAULT 'LOCAL'::character varying NOT NULL
);


--
-- Name: COLUMN files.file_kind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.file_kind IS '파일 종류: BANNER, POST 등';


--
-- Name: COLUMN files.ref_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.ref_id IS '연결된 레코드 ID (banner_id, post_id 등)';


--
-- Name: COLUMN files.original_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.original_name IS '원본 파일명';


--
-- Name: COLUMN files.stored_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.stored_name IS '저장된 파일명';


--
-- Name: COLUMN files.file_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.file_path IS 'storage 기준 상대 경로';


--
-- Name: COLUMN files.file_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.file_url IS '퍼블릭 접근 URL';


--
-- Name: COLUMN files.file_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.file_size IS '바이트 단위';


--
-- Name: COLUMN files.storage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.files.storage IS '저장소: LOCAL | NCP';


--
-- Name: files_file_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.files_file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: files_file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.files_file_id_seq OWNED BY public.files.file_id;


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id bigint NOT NULL,
    type character varying(20) DEFAULT 'SUPPORT'::character varying NOT NULL,
    user_id bigint,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(30),
    title character varying(200) NOT NULL,
    content text NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    answer text,
    answered_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inquiries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: lotto_draws; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lotto_draws (
    drw_no smallint NOT NULL,
    drw_date date NOT NULL,
    no1 smallint NOT NULL,
    no2 smallint NOT NULL,
    no3 smallint NOT NULL,
    no4 smallint NOT NULL,
    no5 smallint NOT NULL,
    no6 smallint NOT NULL,
    bonus_no smallint NOT NULL,
    first_prize_amount bigint NOT NULL,
    first_prize_winners integer NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: post_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_banners (
    post_banner_id bigint NOT NULL,
    post_id bigint NOT NULL,
    banner_id bigint NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: COLUMN post_banners.post_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.post_banners.post_id IS '논리적 FK: posts.post_id';


--
-- Name: COLUMN post_banners.banner_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.post_banners.banner_id IS '논리적 FK: banners.banner_id';


--
-- Name: post_banners_post_banner_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_banners_post_banner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_banners_post_banner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_banners_post_banner_id_seq OWNED BY public.post_banners.post_banner_id;


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(10) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN post_likes.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.post_likes.type IS 'LIKE | DISLIKE';


--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_likes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    post_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    user_id bigint NOT NULL,
    post_status character varying(255) NOT NULL,
    post_type character varying(255) NOT NULL,
    post_category character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    post_data jsonb,
    hits bigint DEFAULT '0'::bigint NOT NULL,
    comment_count integer DEFAULT 0 NOT NULL,
    is_notice boolean DEFAULT false NOT NULL,
    source character varying(255),
    source_id character varying(255),
    like_count integer DEFAULT 0 NOT NULL,
    dislike_count integer DEFAULT 0 NOT NULL
);


--
-- Name: COLUMN posts.post_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.post_status IS '게시글 상태 NORMAL, HIDDEN, DELETED';


--
-- Name: COLUMN posts.post_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.post_type IS '게시글 타입 (ex: notice, gallery, event)';


--
-- Name: COLUMN posts.post_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.post_category IS '게시글 구분';


--
-- Name: COLUMN posts.post_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.post_data IS '기타 설정 및 추가 데이터';


--
-- Name: COLUMN posts.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.source IS '크롤링 출처 사이트 (ex: DOGDRIP)';


--
-- Name: COLUMN posts.source_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.source_id IS '출처 사이트의 게시글 ID';


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.post_id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    user_id bigint,
    ip character varying(45) NOT NULL,
    reason character varying(30) NOT NULL,
    detail character varying(500),
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: scraps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scraps (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    post_id bigint NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: scraps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scraps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scraps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scraps_id_seq OWNED BY public.scraps.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    key character varying(255) NOT NULL,
    value text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: threads_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.threads_logs (
    id bigint NOT NULL,
    post_id bigint,
    post_title character varying(255) NOT NULL,
    hits bigint DEFAULT '0'::bigint NOT NULL,
    source character varying(255),
    threads_media_id character varying(255),
    threads_permalink character varying(500),
    status character varying(255) NOT NULL,
    message text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: threads_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.threads_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: threads_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.threads_logs_id_seq OWNED BY public.threads_logs.id;


--
-- Name: user_daily_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_daily_stats (
    id bigint NOT NULL,
    stat_date date NOT NULL,
    reg_count integer DEFAULT 0 NOT NULL,
    login_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: user_daily_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_daily_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_daily_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_daily_stats_id_seq OWNED BY public.user_daily_stats.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    user_role character varying(255) DEFAULT 'GENERAL'::character varying NOT NULL,
    last_login_at timestamp(0) without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: banner_daily_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banner_daily_stats ALTER COLUMN id SET DEFAULT nextval('public.banner_daily_stats_id_seq'::regclass);


--
-- Name: banners banner_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners ALTER COLUMN banner_id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: blogger_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogger_logs ALTER COLUMN id SET DEFAULT nextval('public.blogger_logs_id_seq'::regclass);


--
-- Name: boards board_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards ALTER COLUMN board_id SET DEFAULT nextval('public.boards_board_id_seq'::regclass);


--
-- Name: comments comment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN comment_id SET DEFAULT nextval('public.comments_comment_id_seq'::regclass);


--
-- Name: crawl_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_logs ALTER COLUMN id SET DEFAULT nextval('public.crawl_logs_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: files file_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files ALTER COLUMN file_id SET DEFAULT nextval('public.files_file_id_seq'::regclass);


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: post_banners post_banner_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_banners ALTER COLUMN post_banner_id SET DEFAULT nextval('public.post_banners_post_banner_id_seq'::regclass);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: posts post_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN post_id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: scraps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraps ALTER COLUMN id SET DEFAULT nextval('public.scraps_id_seq'::regclass);


--
-- Name: threads_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.threads_logs ALTER COLUMN id SET DEFAULT nextval('public.threads_logs_id_seq'::regclass);


--
-- Name: user_daily_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_stats ALTER COLUMN id SET DEFAULT nextval('public.user_daily_stats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: admins admins_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_unique UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: banner_daily_stats banner_daily_stats_banner_id_stat_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banner_daily_stats
    ADD CONSTRAINT banner_daily_stats_banner_id_stat_date_unique UNIQUE (banner_id, stat_date);


--
-- Name: banner_daily_stats banner_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banner_daily_stats
    ADD CONSTRAINT banner_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (banner_id);


--
-- Name: blogger_logs blogger_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogger_logs
    ADD CONSTRAINT blogger_logs_pkey PRIMARY KEY (id);


--
-- Name: boards boards_category_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_category_unique UNIQUE (category);


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (board_id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);


--
-- Name: crawl_logs crawl_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crawl_logs
    ADD CONSTRAINT crawl_logs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (file_id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: lotto_draws lotto_draws_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotto_draws
    ADD CONSTRAINT lotto_draws_pkey PRIMARY KEY (drw_no);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: post_banners post_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_banners
    ADD CONSTRAINT post_banners_pkey PRIMARY KEY (post_banner_id);


--
-- Name: post_banners post_banners_post_id_banner_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_banners
    ADD CONSTRAINT post_banners_post_id_banner_id_unique UNIQUE (post_id, banner_id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_unique UNIQUE (post_id, user_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (post_id);


--
-- Name: posts posts_source_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_source_unique UNIQUE (source, source_id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reports reports_post_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_post_id_user_id_unique UNIQUE (post_id, user_id);


--
-- Name: scraps scraps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_pkey PRIMARY KEY (id);


--
-- Name: scraps scraps_user_id_post_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_user_id_post_id_unique UNIQUE (user_id, post_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: threads_logs threads_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.threads_logs
    ADD CONSTRAINT threads_logs_pkey PRIMARY KEY (id);


--
-- Name: user_daily_stats user_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_stats
    ADD CONSTRAINT user_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: user_daily_stats user_daily_stats_stat_date_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_stats
    ADD CONSTRAINT user_daily_stats_stat_date_unique UNIQUE (stat_date);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: blogger_logs_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blogger_logs_created_at_index ON public.blogger_logs USING btree (created_at);


--
-- Name: blogger_logs_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX blogger_logs_status_index ON public.blogger_logs USING btree (status);


--
-- Name: boards_board_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX boards_board_order_index ON public.boards USING btree (board_order);


--
-- Name: boards_board_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX boards_board_status_index ON public.boards USING btree (board_status);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: comments_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_parent_id_index ON public.comments USING btree (parent_id);


--
-- Name: comments_post_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_post_id_index ON public.comments USING btree (post_id);


--
-- Name: crawl_logs_source_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX crawl_logs_source_index ON public.crawl_logs USING btree (source);


--
-- Name: files_kind_ref_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX files_kind_ref_idx ON public.files USING btree (file_kind, ref_id);


--
-- Name: inquiries_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inquiries_status_index ON public.inquiries USING btree (status);


--
-- Name: inquiries_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inquiries_type_index ON public.inquiries USING btree (type);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: post_likes_post_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_likes_post_id_index ON public.post_likes USING btree (post_id);


--
-- Name: posts_category_list_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_category_list_idx ON public.posts USING btree (post_category, post_status, created_at);


--
-- Name: posts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at);


--
-- Name: posts_hits_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX posts_hits_index ON public.posts USING btree (hits);


--
-- Name: reports_post_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reports_post_id_index ON public.reports USING btree (post_id);


--
-- Name: reports_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reports_status_index ON public.reports USING btree (status);


--
-- Name: scraps_post_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scraps_post_id_index ON public.scraps USING btree (post_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: threads_logs_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_logs_created_at_index ON public.threads_logs USING btree (created_at);


--
-- Name: threads_logs_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX threads_logs_status_index ON public.threads_logs USING btree (status);


--
-- Name: scraps scraps_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict u1IYcby7hmDu2EQ72e9ElxS18gkVKaOmhYcdjKWPwtQBj9AcvX6wXorYXi2BKYH

--
-- PostgreSQL database dump
--

\restrict 1JxWdS5Uud9rjr5SoKSO5ryO3pdu3RII5hET4BdBUkd4XuviewcLjBFc6uY9Eqv

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_03_26_030050_create_admins_table	2
5	2026_04_01_031956_create_posts_table	3
6	2026_04_06_000000_create_banners_table	4
7	2026_04_06_000001_rename_id_to_post_id_in_posts_table	5
8	2026_04_06_000002_rename_id_to_banner_id_in_banners_table	5
9	2026_04_06_000003_create_post_banners_table	5
10	2026_04_06_000004_create_files_table	6
11	2026_04_07_000000_add_source_columns_to_posts_table	7
12	2026_04_08_000000_create_boards_table	8
13	2026_04_08_000001_uppercase_board_layout_values	9
14	2026_04_08_000002_add_banner_type_and_content_to_banners_table	10
15	2026_04_09_062509_add_user_role_to_users_table	11
16	2026_04_09_073418_create_comments_table	12
17	2026_04_11_091402_add_parent_id_to_comments_table	13
18	2026_04_11_101948_add_index_to_files_table	14
19	2026_04_12_015154_add_like_counts_to_posts_table	15
20	2026_04_12_015154_create_post_likes_table	15
21	2026_04_12_111504_create_crawl_logs_table	16
22	2026_04_12_182454_create_inquiries_table	17
23	2026_04_12_184717_create_reports_table	18
24	2026_04_13_110122_create_scraps_table	19
25	2026_04_13_200000_create_user_daily_stats_table	20
26	2026_04_14_000001_create_site_settings_table	21
27	2026_04_15_112827_add_storage_to_files_table	22
28	2026_04_16_150506_add_index_to_posts_table	23
29	2026_04_17_123727_remove_deleted_at_from_posts_and_comments_tables	24
30	2026_04_17_124452_remove_deleted_at_from_banners_and_boards_tables	25
31	2026_04_19_000000_add_super_and_permissions_to_admins_table	26
32	2026_04_21_114918_add_last_login_at_to_users_table	27
33	2026_04_21_125849_create_banner_daily_stats_table	28
34	2026_04_28_114824_create_blogger_logs_table	29
35	2026_05_21_000001_create_threads_logs_table	30
36	2026_05_26_000001_create_lotto_draws_table	31
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 36, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 1JxWdS5Uud9rjr5SoKSO5ryO3pdu3RII5hET4BdBUkd4XuviewcLjBFc6uY9Eqv

