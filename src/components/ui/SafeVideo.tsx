import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
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
  onFallbackOpen?: () => void;
}

const InlineVideoPlayer: React.FC<{
  videoUrl: string;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ videoUrl, onClose, style }) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = false;
    p.play();
  });

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
  height = 220,
  onFallbackOpen,
}) => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartPlay = (e: any) => {
    e?.stopPropagation?.();
    if (videoUrl && videoUrl.trim()) {
      setIsPlaying(true);
    } else if (onFallbackOpen) {
      onFallbackOpen();
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  const containerHeight = height || 220;

  if (isPlaying && videoUrl) {
    return (
      <InlineVideoPlayer
        videoUrl={videoUrl}
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
          backgroundColor: isDark ? '#141210' : '#EBE5DC',
        },
        style,
      ]}
    >
      {posterUrl ? (
        <SafeImage
          url={posterUrl}
          style={[styles.posterImage, imageStyle as any]}
          resizeMode="cover"
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
    ...StyleSheet.absoluteFill,
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
});
