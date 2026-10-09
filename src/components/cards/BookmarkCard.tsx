import React, { useMemo } from 'react';
import type { Bookmark } from '../../types/bookmark';
import { resolveCardType } from '../../utils/helpers';
import { SkeletonCard } from '../ui/SkeletonCard';
import { GenericCard } from './GenericCard';
import { TwitterCard } from './TwitterCard';
import { InstagramCard } from './InstagramCard';
import { LinkedInCard } from './LinkedInCard';
import { YouTubeCard } from './YouTubeCard';
import { RedditCard } from './RedditCard';
import { FacebookCard } from './FacebookCard';
import { PinterestCard } from './PinterestCard';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onOpenMenu: (bookmark: Bookmark) => void;
  onReadArticle?: (bookmark: Bookmark) => void;
  onViewAiContext?: (bookmark: Bookmark) => void;
  onOpenMedia?: (bookmark: Bookmark, initialIndex?: number) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = React.memo((props) => {
  const { bookmark } = props;

  if (bookmark.isFetchingMetadata) {
    return <SkeletonCard />;
  }

  const cardType = resolveCardType(bookmark);

  switch (cardType) {
    case 'x':
      return <TwitterCard {...props} />;
    case 'instagram':
      return <InstagramCard {...props} />;
    case 'linkedin':
      return <LinkedInCard {...props} />;
    case 'youtube':
      return <YouTubeCard {...props} />;
    case 'reddit':
      return <RedditCard {...props} />;
    case 'facebook':
      return <FacebookCard {...props} />;
    case 'pinterest':
      return <PinterestCard {...props} />;
    default:
      return <GenericCard {...props} />;
  }
});
