import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeImage } from './SafeImage';
import { SafeVideo } from './SafeVideo';
import { CarouselNavButtons } from './CarouselNavButtons';
import { useTheme } from '../../context/ThemeContext';

export interface MediaSlideItem {
  type: 'image' | 'video';
  url: string;
  posterUrl?: string | null;
}

export interface SlidableMediaProps {
  items?: MediaSlideItem[];
  images?: string[];
  videoUrl?: string | null;
  posterUrl?: string | null;
  height?: number;
  style?: StyleProp<ViewStyle>;
  onPressItem?: (index: number) => void;
  onFallbackOpen?: () => void;
  dotActiveColor?: string;
}

export const SlidableMedia: React.FC<SlidableMediaProps> = ({
  items,
  images,
  videoUrl,
  posterUrl,
  height = 240,
  style,
  onPressItem,
  onFallbackOpen,
  dotActiveColor,
}) => {
  const { colors, isDark } = useTheme();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  // Normalize media items into an array of { type, url, posterUrl }
  const mediaList: MediaSlideItem[] = React.useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
    const list: MediaSlideItem[] = [];
    if (videoUrl) {
      list.push({
        type: 'video',
        url: videoUrl,
        posterUrl: posterUrl || null,
      });
    }
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img && typeof img === 'string') {
          list.push({
            type: 'image',
            url: img,
          });
        }
      }
    } else if (posterUrl && !videoUrl) {
      list.push({
        type: 'image',
        url: posterUrl,
      });
    }
    return list;
  }, [items, images, videoUrl, posterUrl]);

  if (mediaList.length === 0) {
    return null;
  }

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerWidth <= 0) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / containerWidth);
    if (newIndex >= 0 && newIndex < mediaList.length && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= mediaList.length || containerWidth <= 0) return;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({
      x: index * containerWidth,
      animated: true,
    });
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < mediaList.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  const handlePress = (idx: number) => {
    if (onPressItem) {
      onPressItem(idx);
    } else if (onFallbackOpen) {
      onFallbackOpen();
    }
  };

  const activeDot = dotActiveColor || colors.primary || '#0095F6';

  // Single Item: Render without carousel controls
  if (mediaList.length === 1) {
    const item = mediaList[0];
    return (
      <View style={[styles.container, { height }, style]}>
        {item.type === 'video' ? (
          <SafeVideo
            videoUrl={item.url}
            posterUrl={item.posterUrl}
            height={height}
            onFallbackOpen={onFallbackOpen}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => handlePress(0)}
            style={styles.singleImageTouch}
          >
            <SafeImage
              url={item.url}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Multi-Item Carousel
  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          { height, backgroundColor: isDark ? '#141210' : '#EBE5DC' },
        ]}
        onLayout={handleLayout}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={{ width: containerWidth ? containerWidth * mediaList.length : undefined }}
        >
          {mediaList.map((item, idx) => (
            <View
              key={`${item.url}-${idx}`}
              style={[
                styles.slide,
                { width: containerWidth || '100%', height },
              ]}
            >
              {item.type === 'video' ? (
                <SafeVideo
                  videoUrl={item.url}
                  posterUrl={item.posterUrl}
                  height={height}
                  onFallbackOpen={onFallbackOpen}
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => handlePress(idx)}
                  style={styles.singleImageTouch}
                >
                  <SafeImage
                    url={item.url}
                    style={styles.fillImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Counter Badge (Top Right) */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{mediaList.length}
          </Text>
        </View>

        {/* Previous and Next Navigation Buttons */}
        <CarouselNavButtons
          activeIndex={activeIndex}
          total={mediaList.length}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </View>

      {/* Dots Indicator (Centered below media) */}
      <View style={styles.dotsRow}>
        {mediaList.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={() => scrollToIndex(idx)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <View
              style={[
                styles.dot,
                idx === activeIndex
                  ? [styles.activeDot, { backgroundColor: activeDot }]
                  : [
                      styles.inactiveDot,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.28)'
                          : 'rgba(0, 0, 0, 0.22)',
                      },
                    ],
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  slide: {
    height: '100%',
    overflow: 'hidden',
  },
  singleImageTouch: {
    width: '100%',
    height: '100%',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 8,
    paddingBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 14,
    borderRadius: 4,
  },
  inactiveDot: {
    opacity: 0.8,
  },
});
