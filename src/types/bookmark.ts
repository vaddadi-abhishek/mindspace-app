export interface MediaItem {
  type: 'image' | 'video' | string;
  url: string;
}

export interface XCardData {
  author: {
    name: string;
    handle: string;
    avatar_url: string | null;
    verified: boolean;
  };
  metrics: {
    replies?: number;
    reposts?: number;
    likes?: number;
    views?: number;
    bookmarks?: number;
  };
  media: MediaItem[];
  posted_at: string;
  video_thumbnail?: string | null;
}

export interface InstagramCardData {
  author: {
    username: string;
    name: string;
    avatar_url: string | null;
    verified: boolean;
  };
  metrics: {
    likes?: number;
    comments?: number;
    reposts?: number;
  };
  media: MediaItem[];
  images?: Array<string | { url?: string; src?: string; display_url?: string; [key: string]: unknown }>;
  posted_at: string;
  video_thumbnail?: string | null;
}

export interface FacebookCardData {
  author: {
    name: string;
    avatar_url: string | null;
  };
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  media: MediaItem[];
  posted_at: string | null;
  video_thumbnail?: string | null;
}

export interface LinkedInCardData {
  author: {
    name: string;
    avatar_url: string | null;
  };
  metrics: {
    reactions?: number;
    comments?: number;
    reposts?: number;
  };
  media?: MediaItem[];
  posted_at: string | null;
  video_thumbnail?: string | null;
  type?: string | null;
  page_intent?: string | null;
  document?: {
    title?: string | null;
    page_count?: number | null;
    pdf_url?: string | null;
  } | null;
}

export interface RedditCardData {
  subreddit: {
    name: string;
    icon_url: string | null;
  };
  author: string;
  metrics: {
    upvotes?: number;
    comments?: number;
  };
  posted_at: string | null;
  media: MediaItem[];
  video_thumbnail?: string | null;
}

export interface YouTubeCardData {
  channel: {
    name: string;
    avatar_url: string | null;
  };
  metrics: {
    views?: number;
    likes?: number;
  };
  video_id: string | null;
  posted_at: string | null;
  video_thumbnail?: string | null;
}

export interface GlobalWebCardData {
  author: string | null;
  published_at: string | null;
  site_name: string | null;
  type: string | null;
  snapshot?: string | null;
}

export interface PinterestCardData {
  author?: {
    name?: string;
    username?: string;
    avatar_url?: string | null;
  };
  metrics?: {
    saves?: number;
    comments?: number;
    repins?: number;
  };
  media?: MediaItem[];
  posted_at?: string | null;
  video_thumbnail?: string | null;
}

export type AnyCardData =
  | XCardData
  | InstagramCardData
  | FacebookCardData
  | LinkedInCardData
  | RedditCardData
  | YouTubeCardData
  | PinterestCardData
  | GlobalWebCardData
  | Record<string, unknown>;

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  logo: string | null;
  snapshot_url?: string | null;
  snapshot?: string | null;
  site_name: string;
  tags?: string[];
  collections?: string[];
  created_at?: string;
  isFetchingMetadata?: boolean;
  type?: string;
  card_data?: AnyCardData;
  is_article?: boolean;
  ai_status?: 'completed' | 'pending_manual' | 'no_credits' | 'failed';
  ai_context?: string | null;
  ai_category?: string[];
  ai_tags?: string[];
  visual_entities?: string[];
  ocr_text?: string;
  already_exists?: boolean;
}

export interface ArticleContent {
  bookmark_id: string;
  content_html: string;
  word_count: number;
  reading_time_minutes: number;
  created_at: string;
  title?: string | null;
  url?: string | null;
  site_name?: string | null;
  description?: string | null;
  logo_url?: string | null;
}

export interface MetadataResponse {
  url: string;
  title: string;
  description: string;
  logo: string | null;
  site_name: string;
  type?: string;
  card_data?: AnyCardData;
  ai_context?: string | null;
  ai_category?: string[];
  ai_tags?: string[];
  visual_entities?: string[];
  ocr_text?: string;
  ai_status?: 'completed' | 'pending_manual' | 'no_credits' | 'failed';
}

export interface UserPlanInfo {
  plan: 'free' | 'pro';
  is_paid: boolean;
  credits_remaining: number;
  credits_limit: number;
  credits_used: number;
  credits_reset_at: string;
  trial_ends_at: string;
  auto_ai_context: boolean;
}

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
}

export interface SignUpResponse {
  user: AuthUser | null;
  token?: string | null;
  refreshToken?: string | null;
  message?: string;
  requireVerification?: boolean;
  email?: string;
}

