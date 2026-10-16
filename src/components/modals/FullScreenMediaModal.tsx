import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Ellipsis,
  Play,
  Pause,
  Download,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import type { LiquidGlassViewProps } from '@callstack/liquid-glass';
import { SafeImage } from '../ui/SafeImage';
import {
  extractMediaDetails,
  parseCardData,
  sanitizeUrl,
} from '../../utils/helpers';
import type { Bookmark } from '../../types/bookmark';

export interface FullScreenMediaModalProps {
  visible: boolean;
  bookmark: Bookmark | null;
  initialIndex?: number;
  onClose: () => void;
  onOpenMenu?: (bookmark: Bookmark) => void;
}

interface MediaItem {
  type: 'video' | 'image';
  url: string;
  posterUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Liquid Glass Wrapper Component (@callstack/liquid-glass)
// ---------------------------------------------------------------------------
let NativeLiquidGlassView: React.ComponentType<any> | null = null;
let isNativeGlassSupported = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lg = require('@callstack/liquid-glass');
  NativeLiquidGlassView = lg.LiquidGlassView;
  isNativeGlassSupported = Boolean(lg.isLiquidGlassSupported);
} catch {
  NativeLiquidGlassView = null;
  isNativeGlassSupported = false;
}

interface GlassViewProps extends LiquidGlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  effect = 'regular',
  colorScheme = 'dark',
  interactive = false,
  ...props
}) => {
  if (NativeLiquidGlassView && isNativeGlassSupported) {
    try {
      return (
        <NativeLiquidGlassView
          effect={effect}
          colorScheme={colorScheme}
          interactive={interactive}
          style={[styles.glassFallback, style]}
          {...props}
        >
          {children}
        </NativeLiquidGlassView>
      );
    } catch {
      // Gracefully fall back to styled view
    }
  }

  return (
    <View style={[styles.glassFallback, style]} {...props}>
      {children}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Custom Vector Icons for Seek -15s and Seek +15s
// ---------------------------------------------------------------------------
const SeekBackward15Icon: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 3v5h5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <SvgText
      x="12"
      y="15.5"
      fill={color}
      fontSize="7.5"
      fontWeight="700"
      textAnchor="middle"
    >
      15
    </SvgText>
  </Svg>
);

const SeekForward15Icon: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 3v5h-5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <SvgText
      x="12"
      y="15.5"
      fill={color}
      fontSize="7.5"
      fontWeight="700"
      textAnchor="middle"
    >
      15
    </SvgText>
  </Svg>
);

// ---------------------------------------------------------------------------
// Helper: Format Seconds to M:SS (e.g. 0:12, 0:50)
// ---------------------------------------------------------------------------
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// ---------------------------------------------------------------------------
// FullScreenVideoPlayer
// ---------------------------------------------------------------------------
interface FullScreenVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string | null;
  isActive: boolean;
  controlsVisible: boolean;
  onToggleControls: () => void;
  onUserInteraction: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const FullScreenVideoPlayer: React.FC<FullScreenVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  isActive,
  controlsVisible,
  onToggleControls,
  onUserInteraction,
  onPlayStateChange,
}) => {
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // Scrubber drag state & animation
  const [isDragging, setIsDragging] = useState(false);
  const [dragRatio, setDragRatio] = useState(0);
  const dotScaleAnim = useRef(new Animated.Value(0)).current;

  // Video UI animation: center controls & bottom scrubber
  const controlsAnim = useRef(new Animated.Value(controlsVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(controlsAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsAnim]);

  const player = useVideoPlayer({ uri: videoUrl, useCaching: true }, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading' || status === 'idle');
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
      onPlayStateChange(playing);
      if (playing) {
        setIsBuffering(false);
      }
    });

    const timeSub = player.addListener('timeUpdate', (event) => {
      if (!isDragging) {
        setCurrentTime(event.currentTime);
      }
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
    });

    if (player.status === 'readyToPlay') {
      setIsBuffering(false);
      if (player.duration && player.duration > 0) {
        setDuration(player.duration);
      }
    }

    return () => {
      statusSub.remove();
      playingSub.remove();
      timeSub.remove();
    };
  }, [player, isDragging, onPlayStateChange]);

  useEffect(() => {
    if (isActive) {
      player.play();
      setIsPlaying(true);
      onPlayStateChange(true);
    } else {
      player.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    }
  }, [isActive, player, onPlayStateChange]);

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
      onPlayStateChange(false);
    } else {
      player.play();
      setIsPlaying(true);
      onPlayStateChange(true);
    }
    onUserInteraction();
  };

  const handleSeek = (seconds: number) => {
    player.seekBy(seconds);
    onUserInteraction();
  };

  // Dragging / Scrubbing Handlers
  const handleScrubberGrant = (evt: GestureResponderEvent) => {
    if (trackWidth <= 0) return;
    const activeDur = duration || player.duration || 0;
    if (activeDur <= 0) return;

    const x = Math.max(0, Math.min(trackWidth, evt.nativeEvent.locationX));
    const ratio = x / trackWidth;
    setIsDragging(true);
    setDragRatio(ratio);
    onUserInteraction();

    Animated.spring(dotScaleAnim, {
      toValue: 1,
      tension: 200,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  const handleScrubberMove = (evt: GestureResponderEvent) => {
    if (trackWidth <= 0) return;
    const x = Math.max(0, Math.min(trackWidth, evt.nativeEvent.locationX));
    const ratio = x / trackWidth;
    setDragRatio(ratio);
    onUserInteraction();
  };

  const handleScrubberRelease = (evt: GestureResponderEvent) => {
    if (trackWidth <= 0 || !player) return;
    const activeDur = duration || player.duration || 0;
    if (activeDur > 0) {
      const x = Math.max(0, Math.min(trackWidth, evt.nativeEvent.locationX));
      const ratio = x / trackWidth;
      const targetTime = ratio * activeDur;
      player.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
    setIsDragging(false);
    onUserInteraction();

    Animated.timing(dotScaleAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const activeDuration = duration || player.duration || 0;
  const displayRatio = isDragging
    ? dragRatio
    : activeDuration > 0
    ? currentTime / activeDuration
    : 0;
  const displayTime = isDragging
    ? dragRatio * activeDuration
    : currentTime;

  return (
    <View style={styles.playerContainer}>
      {/* Background full touch surface: Clicking ONLY toggles UI controls; NEVER pauses/plays */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onToggleControls}
        style={styles.videoTouchTarget}
      >
        <VideoView
          player={player}
          style={styles.fullVideo}
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          allowsPictureInPicture={true}
          contentFit="contain"
        />
      </TouchableOpacity>

      {/* Poster Backdrop while buffering initial video */}
      {isBuffering && posterUrl && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SafeImage
            url={posterUrl}
            style={styles.fullVideo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Buffering Spinner Overlay */}
      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <GlassView effect="regular" colorScheme="dark" style={styles.bufferingPill}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.bufferingText}>Loading video...</Text>
          </GlassView>
        </View>
      )}

      {/* Center Controls: Rewind 15s | Play/Pause | Forward 15s with smooth scale & fade */}
      <Animated.View
        pointerEvents={controlsVisible && !isBuffering ? 'box-none' : 'none'}
        style={[
          styles.centerControlsRow,
          {
            opacity: controlsAnim,
            transform: [
              {
                scale: controlsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Rewind 15s */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSeek(-15)}
          style={styles.seekBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <GlassView
            effect="clear"
            colorScheme="dark"
            interactive={true}
            style={styles.seekGlassCircle}
          >
            <SeekBackward15Icon size={32} color="#FFFFFF" />
          </GlassView>
        </TouchableOpacity>

        {/* Large Center Play / Pause Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={togglePlayback}
          style={styles.playPauseBtn}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <GlassView
            effect="clear"
            colorScheme="dark"
            interactive={true}
            style={styles.playPauseGlassCircle}
          >
            {isPlaying ? (
              <Pause size={34} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play
                size={38}
                color="#FFFFFF"
                fill="#FFFFFF"
                style={{ marginLeft: 4 }}
              />
            )}
          </GlassView>
        </TouchableOpacity>

        {/* Forward 15s */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSeek(15)}
          style={styles.seekBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <GlassView
            effect="clear"
            colorScheme="dark"
            interactive={true}
            style={styles.seekGlassCircle}
          >
            <SeekForward15Icon size={32} color="#FFFFFF" />
          </GlassView>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom Floating Glass Scrubber Bar: Smooth slide-up & fade animation */}
      <Animated.View
        pointerEvents={controlsVisible && !isBuffering ? 'box-none' : 'none'}
        style={[
          styles.bottomScrubberContainer,
          {
            bottom: Math.max(insets.bottom, 16) + 16,
            opacity: controlsAnim,
            transform: [
              {
                translateY: controlsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <GlassView effect="clear" colorScheme="dark" style={styles.scrubberPill}>
          {/* Left current timestamp (shows live scrub time while dragging) */}
          <Text style={styles.timeText}>{formatTime(displayTime)}</Text>

          {/* Interactive Progress Track with Drag Dot / Thumb */}
          <View
            style={styles.scrubberTouchArea}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleScrubberGrant}
            onResponderMove={handleScrubberMove}
            onResponderRelease={handleScrubberRelease}
            onResponderTerminate={handleScrubberRelease}
          >
            <View style={styles.scrubberTrack}>
              {/* Filled progress bar */}
              <View
                style={[
                  styles.scrubberFill,
                  {
                    width: `${Math.min(100, Math.max(0, displayRatio * 100))}%`,
                  },
                ]}
              />

              {/* Scrubber Dot / Thumb showing where dragging to */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.scrubberThumb,
                  {
                    left: `${Math.min(100, Math.max(0, displayRatio * 100))}%`,
                    transform: [
                      { translateX: -7 },
                      { scale: dotScaleAnim },
                    ],
                  },
                ]}
              />
            </View>
          </View>

          {/* Right total duration */}
          <Text style={styles.timeText}>
            {formatTime(activeDuration)}
          </Text>
        </GlassView>
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// FullScreenMediaModal Main Component
// ---------------------------------------------------------------------------
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Top Bar animation value (smooth slide-down from top & fade)
  const topAnim = useRef(new Animated.Value(controlsVisible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(topAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, topAnim]);

  // Manage auto-hide timer for video controls
  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    cancelHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);
  }, [cancelHideTimer]);

  const handleToggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      const next = !prev;
      if (!next) {
        setIsMenuOpen(false);
      }
      if (next && isVideoPlaying) {
        startHideTimer();
      } else {
        cancelHideTimer();
      }
      return next;
    });
  }, [isVideoPlaying, startHideTimer, cancelHideTimer]);

  const handleUserInteraction = useCallback(() => {
    if (isVideoPlaying) {
      startHideTimer();
    }
  }, [isVideoPlaying, startHideTimer]);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsVideoPlaying(playing);
    if (playing && controlsVisible) {
      startHideTimer();
    } else if (!playing) {
      cancelHideTimer();
    }
  }, [controlsVisible, startHideTimer, cancelHideTimer]);

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
      setIsMenuOpen(false);
      setControlsVisible(true);
      startHideTimer();

      setTimeout(() => {
        if (initialIndex > 0 && scrollRef.current) {
          scrollRef.current.scrollTo({
            x: initialIndex * screenWidth,
            animated: false,
          });
        }
      }, 50);
    } else {
      setIsMenuOpen(false);
      cancelHideTimer();
    }
    return () => cancelHideTimer();
  }, [visible, initialIndex, screenWidth, startHideTimer, cancelHideTimer]);

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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (screenWidth <= 0) return;
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (newIdx >= 0 && newIdx < mediaItems.length && newIdx !== activeIndex) {
      setActiveIndex(newIdx);
    }
  };

  const currentItem = mediaItems[activeIndex] || mediaItems[0];
  const isCurrentVideo = currentItem?.type === 'video';

  const handleDownload = async () => {
    if (!currentItem?.url) return;
    try {
      await Linking.openURL(currentItem.url);
    } catch (err) {
      console.error('Failed to open media URL for download:', err);
    }
    setIsMenuOpen(false);
  };

  const handleCopyMediaLink = async () => {
    if (!currentItem?.url) return;
    try {
      await Clipboard.setStringAsync(currentItem.url);
    } catch {}
    setIsMenuOpen(false);
  };

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Main Media Carousel / Viewer */}
      <View style={styles.mediaStage}>
        {mediaItems.length === 1 ? (
          <View style={[styles.slideWrap, { width: screenWidth, height: screenHeight }]}>
            {mediaItems[0].type === 'video' ? (
              <FullScreenVideoPlayer
                videoUrl={mediaItems[0].url}
                posterUrl={mediaItems[0].posterUrl}
                isActive={true}
                controlsVisible={controlsVisible}
                onToggleControls={handleToggleControls}
                onUserInteraction={handleUserInteraction}
                onPlayStateChange={handlePlayStateChange}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleToggleControls}
                style={[styles.fullImageWrap, { width: screenWidth, height: screenHeight }]}
              >
                <SafeImage
                  url={mediaItems[0].url}
                  style={[styles.fullImage, { width: screenWidth, height: screenHeight }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
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
                    posterUrl={item.posterUrl}
                    isActive={idx === activeIndex}
                    controlsVisible={controlsVisible}
                    onToggleControls={handleToggleControls}
                    onUserInteraction={handleUserInteraction}
                    onPlayStateChange={handlePlayStateChange}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleToggleControls}
                    style={[styles.fullImageWrap, { width: screenWidth, height: screenHeight }]}
                  >
                    <SafeImage
                      url={item.url}
                      style={[styles.fullImage, { width: screenWidth, height: screenHeight }]}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Top Bar: Left Close Button (<) and Right 3-Dots Button (•••) with Smooth Slide-down Animation */}
      <Animated.View
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
        style={[
          styles.topBar,
          {
            top: Math.max(insets.top, 16) + 6,
            opacity: topAnim,
            transform: [
              {
                translateY: topAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Top-Left: Circular Glass Back/Close Button (<) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onClose}
          style={styles.circularBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <GlassView
            effect="clear"
            colorScheme="dark"
            interactive={true}
            style={styles.topBtnGlass}
          >
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.4} />
          </GlassView>
        </TouchableOpacity>

        {/* Top-Right: Circular Glass 3-Dots Action Button (•••) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setIsMenuOpen((prev) => !prev)}
          style={styles.circularBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <GlassView
            effect="clear"
            colorScheme="dark"
            interactive={true}
            style={styles.topBtnGlass}
          >
            <Ellipsis size={22} color="#FFFFFF" strokeWidth={2.2} />
          </GlassView>
        </TouchableOpacity>
      </Animated.View>

      {/* Top-Right Download Action Dropdown Menu */}
      {isMenuOpen && (
        <View style={styles.menuContainer} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={[styles.menuDropdown, { top: Math.max(insets.top, 16) + 54 }]}>
            <GlassView effect="regular" colorScheme="dark" style={styles.menuGlass}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuItem}
                onPress={handleDownload}
              >
                <Download size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.menuItemText}>
                  {isCurrentVideo ? 'Download Video' : 'Download Image'}
                </Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuItem}
                onPress={handleCopyMediaLink}
              >
                <Copy size={18} color="#D1D5DB" strokeWidth={2} />
                <Text style={styles.menuItemTextSecondary}>Copy Link</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  const clean = sanitizeUrl(bookmark.url);
                  if (clean) Linking.openURL(clean);
                }}
              >
                <ExternalLink size={18} color="#D1D5DB" strokeWidth={2} />
                <Text style={styles.menuItemTextSecondary}>Open Original Post</Text>
              </TouchableOpacity>
            </GlassView>
          </View>
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
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
  fullImageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
  },
  videoTouchTarget: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },

  // ---------------------------------------------------------------------------
  // Glass Aesthetic Tokens & Fallbacks
  // ---------------------------------------------------------------------------
  glassFallback: {
    backgroundColor: 'rgba(32, 32, 36, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // ---------------------------------------------------------------------------
  // Top Bar Layout
  // ---------------------------------------------------------------------------
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------------------------------------------------------------------
  // Center Video Controls (Seek -15s, Play/Pause, Seek +15s)
  // ---------------------------------------------------------------------------
  centerControlsRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 650,
  },
  seekBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekGlassCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseGlassCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---------------------------------------------------------------------------
  // Bottom Glass Scrubber Bar
  // ---------------------------------------------------------------------------
  bottomScrubberContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 650,
    alignItems: 'center',
  },
  scrubberPill: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  scrubberTouchArea: {
    flex: 1,
    height: 36,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  scrubberTrack: {
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4.75,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 5,
  },

  // ---------------------------------------------------------------------------
  // Top-Right Dropdown Menu
  // ---------------------------------------------------------------------------
  menuContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
  menuDropdown: {
    position: 'absolute',
    right: 16,
    width: 200,
    zIndex: 1000,
  },
  menuGlass: {
    borderRadius: 18,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemTextSecondary: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },

  // ---------------------------------------------------------------------------
  // Buffering Overlay
  // ---------------------------------------------------------------------------
  bufferingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  bufferingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  bufferingText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
