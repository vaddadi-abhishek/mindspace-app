import type { Bookmark } from '../types/bookmark';

export function sanitizeUrl(url?: string): string {
  if (!url) return '';
  const clean = url.trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }
  if (!/^https?:\/\//i.test(clean)) {
    return `https://${clean}`;
  }
  return clean;
}

export function extractUrlFromText(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

export function formatNumber(num?: number | string | null): string | null {
  if (num === undefined || num === null) return null;
  if (typeof num === 'string') {
    const trimmed = num.trim();
    if (!trimmed || trimmed === '0') return null;
    // If it already has K, M, B formatting (e.g. "1.2K", "3.4M", "500k")
    if (/^[0-9.]+[kmbKMB]$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    // Remove commas or spaces
    const cleanStr = trimmed.replace(/,/g, '').replace(/\s+/g, '');
    const parsed = parseFloat(cleanStr);
    if (isNaN(parsed) || parsed <= 0) return null;
    num = parsed;
  }
  if (typeof num === 'number') {
    if (isNaN(num) || num <= 0) return null;
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toLocaleString();
  }
  return null;
}

export interface ExtractedMetrics {
  likes?: number | string | null;
  comments?: number | string | null;
  shares?: number | string | null;
  reposts?: number | string | null;
  views?: number | string | null;
  bookmarks?: number | string | null;
  replies?: number | string | null;
  upvotes?: number | string | null;
  reactions?: number | string | null;
  saves?: number | string | null;
}

export function extractMetrics(cardData: any, rootBookmark?: any): ExtractedMetrics {
  const m = cardData?.metrics || {};
  return {
    likes: m.likes ?? cardData?.likes ?? rootBookmark?.likes ?? null,
    comments: m.comments ?? cardData?.comments ?? rootBookmark?.comments ?? null,
    shares: m.shares ?? cardData?.shares ?? rootBookmark?.shares ?? null,
    reposts: m.reposts ?? cardData?.reposts ?? cardData?.retweets ?? rootBookmark?.reposts ?? null,
    views: m.views ?? cardData?.views ?? rootBookmark?.views ?? null,
    bookmarks: m.bookmarks ?? cardData?.bookmarks ?? rootBookmark?.bookmarks ?? null,
    replies: m.replies ?? cardData?.replies ?? rootBookmark?.replies ?? null,
    upvotes: m.upvotes ?? cardData?.upvotes ?? rootBookmark?.upvotes ?? null,
    reactions: m.reactions ?? cardData?.reactions ?? rootBookmark?.reactions ?? null,
    saves: m.saves ?? cardData?.saves ?? rootBookmark?.saves ?? null,
  };
}

export function formatRelativeDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return null;

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDetailDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${timeStr} · ${dateStr}`;
}

export function parseCardData<T>(rawCardData: unknown): T | null {
  if (!rawCardData) return null;
  if (typeof rawCardData === 'string') {
    try {
      return JSON.parse(rawCardData) as T;
    } catch {
      return null;
    }
  }
  return rawCardData as T;
}

export function getFaviconUrl(rawUrl: string): string {
  try {
    const formatted = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(formatted);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return '';
  }
}

export function extractDomain(rawUrl: string): string {
  try {
    const formatted = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(formatted);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

export function normalizeUrlForComparison(rawUrl: string): string {
  try {
    const formatted = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(formatted);
    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '';
    return `${parsed.hostname.toLowerCase().replace(/^www\./, '')}${pathname}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

export function findDuplicateBookmark(bookmarks: Bookmark[], targetUrl: string): Bookmark | undefined {
  const normalizedTarget = normalizeUrlForComparison(targetUrl);
  return bookmarks.find((bm) => normalizeUrlForComparison(bm.url) === normalizedTarget);
}

export type PlatformType =
  | 'all'
  | 'articles'
  | 'x'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'reddit'
  | 'facebook'
  | 'pinterest';

export const PLATFORM_TABS: { id: PlatformType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'articles', label: 'Articles' },
  { id: 'x', label: 'X / Twitter' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
];

export function resolveCardType(bookmark: Bookmark): string {
  const rawType = (bookmark.type || '').toLowerCase().trim();
  if (['x', 'twitter'].includes(rawType)) return 'x';
  if (['reddit'].includes(rawType)) return 'reddit';
  if (['instagram', 'ig'].includes(rawType)) return 'instagram';
  if (['linkedin'].includes(rawType) || rawType.startsWith('linkedin_')) return 'linkedin';
  if (['youtube', 'yt'].includes(rawType)) return 'youtube';
  if (['facebook', 'fb'].includes(rawType)) return 'facebook';
  if (['pinterest', 'pin'].includes(rawType)) return 'pinterest';

  const url = (bookmark.url || '').toLowerCase();
  const site = (bookmark.site_name || '').toLowerCase();

  if (url.includes('twitter.com') || url.includes('x.com') || site.includes('twitter') || url.includes('t.co')) return 'x';
  if (url.includes('reddit.com') || url.includes('redd.it') || site.includes('reddit')) return 'reddit';
  if (url.includes('instagram.com') || site.includes('instagram')) return 'instagram';
  if (url.includes('pinterest.com') || url.includes('pin.it') || site.includes('pinterest')) return 'pinterest';
  if (url.includes('linkedin.com') || site.includes('linkedin')) return 'linkedin';
  if (url.includes('youtube.com') || url.includes('youtu.be') || site.includes('youtube')) return 'youtube';
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com') || site.includes('facebook')) return 'facebook';

  if (rawType === 'article' || rawType === 'read' || bookmark.is_article) return 'article';
  return 'generic';
}

export function matchesPlatform(bookmark: Bookmark, filter: PlatformType): boolean {
  if (filter === 'all') return true;
  const cardType = resolveCardType(bookmark);
  if (filter === 'articles') return Boolean(bookmark.is_article || cardType === 'article');
  return cardType === filter;
}
