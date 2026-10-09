import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Play } from 'lucide-react-native';

interface VideoPlayOverlayProps {
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'center' | 'badge';
}

export const VideoPlayOverlay: React.FC<VideoPlayOverlayProps> = ({
  size = 46,
  iconSize = 20,
  style,
  variant = 'center',
}) => {
  if (variant === 'badge') {
    return (
      <View style={[styles.badge, style]} pointerEvents="none">
        <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
      </View>
    );
  }

  return (
    <View style={[styles.overlay, style]} pointerEvents="none">
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Play
          size={iconSize}
          color="#FFFFFF"
          fill="#FFFFFF"
          style={{ marginLeft: Math.max(1.5, Math.round(iconSize * 0.1)) }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circle: {
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
});
