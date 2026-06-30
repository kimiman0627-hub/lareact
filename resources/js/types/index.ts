// ────────────────────────────────────────────────
// 도메인 공통 타입 정의
// ────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  point?: number;
  created_at?: string;
}

export interface Board {
  board_id: number;
  board_name: string;
  category: string;
  board_type?: string;
  board_layout?: string;
  description?: string;
  sort_order?: number;
  posts?: Post[];
}

export interface Post {
  post_id: number;
  board_id?: number;
  board_name?: string;
  category?: string;
  title: string;
  content?: string;
  author: string;
  user_id?: number;
  hits?: number;
  comment_count?: number;
  like_count?: number;
  is_notice?: boolean;
  has_image?: boolean;
  thumbnail?: string;
  post_status?: string;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  comment_id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  author: string;
  depth: number;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedData<T = Post> {
  data: T[];
  meta: PaginationMeta;
  links?: PaginationLinks;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginationLinks {
  first?: string;
  last?: string;
  prev?: string | null;
  next?: string | null;
}

export interface SeoData {
  title?: string;
  description?: string;
  canonical?: string;
  og_image?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  new_tab?: boolean;
  children?: NavItem[];
}

export interface Banner {
  banner_id: number;
  title?: string;
  position?: string;
  banner_type?: string;
  link_url?: string;
  image_url?: string;
  content?: string;
  is_active?: boolean;
}

export interface LottoResult {
  round: number;
  draw_date: string;
  numbers: number[];
  bonus: number;
  prize_amount?: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change?: number;
  change_rate?: number;
  volume?: number;
}

export interface AdminMenu {
  label: string;
  icon?: string;
  route?: string;
  path?: string;
  submenu?: AdminMenuItem[];
}

export interface AdminMenuItem {
  label: string;
  route: string;
}

// Inertia 페이지 공유 props
export interface SharedProps {
  [key: string]: unknown;
  auth: {
    user: User | null;
  };
  navMenu?: NavItem[];
  adminMenu?: AdminMenu[];
  errors?: Record<string, string>;
  flash?: {
    success?: string;
    error?: string;
  };
}

// http.ts 유틸 옵션 타입
export interface HttpOptions {
  onLoading?: (loading: boolean) => void;
  onBefore?: (visit: unknown) => void;
  onSuccess?: (page: unknown) => void;
  onError?: (errors: Record<string, string>) => void;
  onFinish?: (visit: unknown) => void;
  preserveScroll?: boolean;
  preserveState?: boolean;
  replace?: boolean;
  confirmMsg?: string;
  [key: string]: unknown;
}

// ajax 유틸 옵션 타입
export interface AjaxOptions {
  data?: unknown;
  params?: Record<string, unknown> | null;
  onLoading?: ((loading: boolean) => void) | null;
  onSuccess?: ((data: unknown) => void) | null;
  onError?: ((err: unknown) => void) | null;
  onComplete?: (() => void) | null;
}
