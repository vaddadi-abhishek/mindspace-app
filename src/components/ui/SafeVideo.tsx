import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
  ActivityIndicator,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeImage } from './SafeImage';
import { VideoPlayOverlay } from './VideoPlayOverlay';
import { useTheme } from '../../context/ThemeContext';

interface SafeVideoProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  height?: number;
  onPressMedia?: () => void;
  onFallbackOpen?: () => void;
}

const InlineVideoPlayer: React.FC<{
  videoUrl: string;
  posterUrl?: string | null;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ videoUrl, posterUrl, onClose, style }) => {
  const [isBuffering, setIsBuffering] = useState(true);

  const player = useVideoPlayer({ uri: videoUrl, useCaching: true }, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      setIsBuffering(status === 'loading' || status === 'idle');
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) {
        setIsBuffering(false);
      }
    });

    if (player.status === 'readyToPlay') {
      setIsBuffering(false);
    }

    return () => {
      statusSub.remove();
      playingSub.remove();
    };
  }, [player]);

  return (
    <View style={[styles.playerContainer, style]}>
      <VideoView
        player={player}
        style={styles.videoView}
        nativeControls={true}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture={true}
        contentFit="contain"
      />

      {/* Poster Backdrop while buffering */}
      {isBuffering && posterUrl && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SafeImage
            url={posterUrl}
            style={styles.videoView}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <View style={styles.bufferingPill}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.bufferingText}>Loading video...</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          e.stopPropagation?.();
          onClose();
        }}
        style={styles.closeBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={15} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

export const SafeVideo: React.FC<SafeVideoProps> = ({
  videoUrl,
  posterUrl,
  style,
  imageStyle,
  height = 350,
  onPressMedia,
  onFallbackOpen,
}) => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartPlay = (e: any) => {
    e?.stopPropagation?.();
    if (onPressMedia) {
      onPressMedia();
      return;
    }
    if (videoUrl && videoUrl.trim()) {
      setIsPlaying(true);
    } else if (onFallbackOpen) {
      onFallbackOpen();
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  const containerHeight = height || 350;
  const containerBg = isDark ? '#000000' : '#F1EFEA';

  if (isPlaying && videoUrl) {
    return (
      <InlineVideoPlayer
        videoUrl={videoUrl}
        posterUrl={posterUrl}
        onClose={handleClose}
        style={[{ height: containerHeight }, style]}
      />
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleStartPlay}
      style={[
        styles.facadeContainer,
        {
          height: containerHeight,
          backgroundColor: containerBg,
        },
        style,
      ]}
    >
      {posterUrl ? (
        <SafeImage
          url={posterUrl}
          style={[styles.posterImage, imageStyle as any]}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.posterFallback} />
      )}

      {/* Centered Play Button Overlay */}
      <VideoPlayOverlay size={50} iconSize={22} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  facadeContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    ...StyleSheet.absoluteFill,
  },
  playerContainer: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  bufferingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bufferingText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
