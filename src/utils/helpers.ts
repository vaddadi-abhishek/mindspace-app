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

export function formatNumber(num?: number): string | null {
  if (num === undefined || num === null || num <= 0) return null;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
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
  if (bookmark.type) {
    const t = bookmark.type.toLowerCase();
    if (['x', 'twitter'].includes(t)) return 'x';
    if (['instagram', 'ig'].includes(t)) return 'instagram';
    if (['linkedin'].includes(t)) return 'linkedin';
    if (['reddit'].includes(t)) return 'reddit';
    if (['youtube', 'yt'].includes(t)) return 'youtube';
    if (['facebook', 'fb'].includes(t)) return 'facebook';
    if (['pinterest'].includes(t)) return 'pinterest';
    if (['article', 'read'].includes(t)) return 'article';
  }

  const url = (bookmark.url || '').toLowerCase();
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';

  if (bookmark.is_article) return 'article';
  return 'generic';
}

export function matchesPlatform(bookmark: Bookmark, filter: PlatformType): boolean {
  if (filter === 'all') return true;
  if (filter === 'articles') return Boolean(bookmark.is_article);
  const cardType = resolveCardType(bookmark);
  return cardType === filter;
}
