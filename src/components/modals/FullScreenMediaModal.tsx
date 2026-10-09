import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, MoreVertical, ExternalLink, Play } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeImage } from '../ui/SafeImage';
import {
  extractMediaDetails,
  parseCardData,
  resolveCardType,
  sanitizeUrl,
  formatRelativeDate,
} from '../../utils/helpers';
import type { Bookmark } from '../../types/bookmark';
import {
  XBrandLogo,
  InstagramBrandLogo,
  FacebookBrandLogo,
  RedditBrandLogo,
  LinkedInBrandLogo,
  VerifiedBadge,
  FacebookVerifiedBadge,
} from '../cards/SocialCardIcons';

export interface FullScreenMediaModalProps {
  visible: boolean;
  bookmark: Bookmark | null;
  initialIndex?: number;
  onClose: () => void;
  onOpenMenu: (bookmark: Bookmark) => void;
}

interface MediaItem {
  type: 'video' | 'image';
  url: string;
  posterUrl?: string | null;
}

const FullScreenVideoPlayer: React.FC<{
  videoUrl: string;
  isActive: boolean;
}> = ({ videoUrl, isActive }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={togglePlayback}
      style={styles.playerContainer}
    >
      <VideoView
        player={player}
        style={styles.fullVideo}
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={true}
        contentFit="contain"
      />
      {!isPlaying && (
        <View style={styles.pausedIndicator} pointerEvents="none">
          <View style={styles.pausedCircle}>
            <Play size={36} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const FullScreenMediaModal: React.FC<FullScreenMediaModalProps> = ({
  visible,
  bookmark,
  initialIndex = 0,
  onClose,
  onOpenMenu,
}) => {
  const insets = useSafeAreaInsets();
  const screenDimensions = Dimensions.get('window');
  const [screenWidth, setScreenWidth] = useState(screenDimensions.width);
  const [screenHeight, setScreenHeight] = useState(screenDimensions.height);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const dim = Dimensions.get('window');
      setScreenWidth(dim.width);
      setScreenHeight(dim.height);
    };
    const sub = Dimensions.addEventListener('change', updateDimensions);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      setIsExpanded(false);
      setTimeout(() => {
        if (initialIndex > 0 && scrollRef.current) {
          scrollRef.current.scrollTo({
            x: initialIndex * screenWidth,
            animated: false,
          });
        }
      }, 50);
    }
  }, [visible, initialIndex, screenWidth]);

  // Extract all media items from card
  const mediaItems: MediaItem[] = useMemo(() => {
    if (!bookmark) return [];
    const cardData = parseCardData<any>(bookmark.card_data);
    const details = extractMediaDetails(bookmark, cardData);
    const list: MediaItem[] = [];

    if (details.videoUrl) {
      list.push({
        type: 'video',
        url: details.videoUrl,
        posterUrl: details.posterUrl,
      });
    }

    if (Array.isArray(details.imageUrls) && details.imageUrls.length > 0) {
      for (const img of details.imageUrls) {
        if (img && typeof img === 'string') {
          list.push({ type: 'image', url: img });
        }
      }
    } else if (details.posterUrl && !details.videoUrl) {
      list.push({ type: 'image', url: details.posterUrl });
    }

    return list;
  }, [bookmark]);

  if (!visible || !bookmark || mediaItems.length === 0) {
    return null;
  }

  const cardData = parseCardData<any>(bookmark.card_data);
  const cardType = resolveCardType(bookmark);
  const author = cardData?.author || null;
  const authorName = author?.name || author?.username || bookmark.site_name || 'MindSpace';
  const authorHandle = author?.handle
    ? (author.handle.startsWith('@') ? author.handle : `@${author.handle}`)
    : (author?.username ? `@${author.username}` : null);
  const authorAvatar = author?.avatar_url || bookmark.logo || null;
  const isVerified = Boolean(author?.verified);
  const description = bookmark.description || bookmark.title || '';

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (screenWidth <= 0) return;
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (newIdx >= 0 && newIdx < mediaItems.length && newIdx !== activeIndex) {
      setActiveIndex(newIdx);
    }
  };

  const renderPlatformLogo = () => {
    switch (cardType) {
      case 'x':
        return <XBrandLogo size={14} color="#FFFFFF" />;
      case 'instagram':
        return <InstagramBrandLogo size={15} />;
      case 'facebook':
        return <FacebookBrandLogo size={15} />;
      case 'reddit':
        return <RedditBrandLogo size={15} />;
      case 'linkedin':
        return <LinkedInBrandLogo size={15} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Main Media Carousel / Viewer (Backdrop click disabled) */}
      <View style={styles.mediaStage}>
        {mediaItems.length === 1 ? (
          <View style={[styles.slideWrap, { width: screenWidth, height: screenHeight }]}>
            {mediaItems[0].type === 'video' ? (
              <FullScreenVideoPlayer
                videoUrl={mediaItems[0].url}
                isActive={true}
              />
            ) : (
              <SafeImage
                url={mediaItems[0].url}
                style={[styles.fullImage, { width: screenWidth, height: screenHeight }]}
                resizeMode="contain"
              />
            )}
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
            contentContainerStyle={{ width: screenWidth * mediaItems.length }}
          >
            {mediaItems.map((item, idx) => (
              <View
                key={`${item.url}-${idx}`}
                style={[styles.slideWrap, { width: screenWidth, height: screenHeight }]}
              >
                {item.type === 'video' ? (
                  <FullScreenVideoPlayer
                    videoUrl={item.url}
                    isActive={idx === activeIndex}
                  />
                ) : (
                  <SafeImage
                    url={item.url}
                    style={[styles.fullImage, { width: screenWidth, height: screenHeight }]}
                    resizeMode="contain"
                  />
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Top Bar: Close Button (Top Left) & 3 Dots Button (Top Right) */}
      <View
        style={[
          styles.topBar,
          { top: Math.max(insets.top, 16) + 6 },
        ]}
        pointerEvents="box-none"
      >
        {/* Top-Left: Translucent Circular Close Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onClose}
          style={styles.circularBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Multi-Item Slide Index Badge */}
        {mediaItems.length > 1 && (
          <View style={styles.slideCounterBadge}>
            <Text style={styles.slideCounterText}>
              {activeIndex + 1} / {mediaItems.length}
            </Text>
          </View>
        )}

        {/* Top-Right: Translucent Circular 3-Dots Action Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onOpenMenu(bookmark)}
          style={styles.circularBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreVertical size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Bottom Description Overlay: Instagram Reels Style */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.85)', '#000000']}
        locations={[0, 0.25, 0.65, 1]}
        style={[
          styles.bottomGradient,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        pointerEvents="box-none"
      >
        {/* Author Header */}
        <View style={styles.authorRow}>
          {authorAvatar ? (
            <SafeImage
              url={authorAvatar}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(authorName || 'M')[0].toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.authorDetails}>
            <View style={styles.authorNameLine}>
              <Text style={styles.authorNameText} numberOfLines={1}>
                {authorName}
              </Text>
              {isVerified && (
                cardType === 'facebook'
                  ? <FacebookVerifiedBadge size={14} />
                  : <VerifiedBadge size={14} />
              )}
              {renderPlatformLogo()}
            </View>

            {Boolean(authorHandle) && (
              <Text style={styles.handleText} numberOfLines={1}>
                {authorHandle}
                {cardData?.posted_at ? ` · ${formatRelativeDate(cardData.posted_at)}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Caption Text with Reels-style "... more" toggle */}
        {Boolean(description) && (
          <View style={styles.captionContainer}>
            <Text
              style={styles.captionText}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {description}
            </Text>
            {description.length > 90 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsExpanded(!isExpanded)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>
                  {isExpanded ? 'Show less' : '... more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Open Original Link Pill */}
        {Boolean(bookmark.url) && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              const clean = sanitizeUrl(bookmark.url);
              if (clean) Linking.openURL(clean).catch(() => {});
            }}
            style={styles.openLinkPill}
          >
            <ExternalLink size={12} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.openLinkText}>
              Visit original link
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 600,
  },
  mediaStage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  slideWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  fullImage: {
    backgroundColor: '#000000',
  },
  playerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 700,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circularBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  slideCounterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  slideCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 650,
    paddingHorizontal: 18,
    paddingTop: 36,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authorDetails: {
    flex: 1,
    gap: 2,
  },
  authorNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorNameText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  handleText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captionContainer: {
    marginBottom: 10,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 19,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  expandBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  expandBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  openLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  openLinkText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontWeight: '600',
  },
  pausedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  pausedCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

