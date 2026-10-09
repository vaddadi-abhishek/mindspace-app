import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeImage } from './SafeImage';
import { useTheme } from '../../context/ThemeContext';

export interface TwitterImageGridProps {
  images: string[];
  style?: StyleProp<ViewStyle>;
  height?: number;
  onPressImage?: (index: number) => void;
  onPressCard?: () => void;
}

export const TwitterImageGrid: React.FC<TwitterImageGridProps> = ({
  images,
  style,
  height = 350,
  onPressImage,
  onPressCard,
}) => {
  const { colors, isDark } = useTheme();

  if (!images || images.length === 0) {
    return null;
  }

  const handlePress = (index: number) => {
    if (onPressImage) {
      onPressImage(index);
    } else if (onPressCard) {
      onPressCard();
    }
  };

  const containerBorderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const dividerColor = isDark ? '#000000' : '#F1EFEA';

  // 1 IMAGE: Full Width Card
  if (images.length === 1) {
    return (
      <View
        style={[
          styles.container,
          {
            height: height || 350,
            borderColor: containerBorderColor,
            backgroundColor: isDark ? '#000000' : '#F1EFEA',
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handlePress(0)}
          style={[styles.flex1, { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }]}
        >
          <SafeImage
            url={images[0]}
            style={styles.fillImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  }

  // 2 IMAGES: 2 Equal Columns Side-by-Side
  if (images.length === 2) {
    return (
      <View
        style={[
          styles.container,
          {
            height: height || 220,
            borderColor: containerBorderColor,
            backgroundColor: dividerColor,
          },
          style,
        ]}
      >
        <View style={[styles.row, { gap: 3 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(0)}
            style={styles.flex1}
          >
            <SafeImage
              url={images[0]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(1)}
            style={styles.flex1}
          >
            <SafeImage
              url={images[1]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3 IMAGES: Left 1 Large Image (Full Height) | Right 2 Stacked Images
  if (images.length === 3) {
    return (
      <View
        style={[
          styles.container,
          {
            height: height || 230,
            borderColor: containerBorderColor,
            backgroundColor: dividerColor,
          },
          style,
        ]}
      >
        <View style={[styles.row, { gap: 3 }]}>
          {/* Left Column: 1 Large Image */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(0)}
            style={styles.flex1}
          >
            <SafeImage
              url={images[0]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* Right Column: 2 Stacked Images */}
          <View style={[styles.flex1, { gap: 3 }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handlePress(1)}
              style={styles.flex1}
            >
              <SafeImage
                url={images[1]}
                style={styles.fillImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handlePress(2)}
              style={styles.flex1}
            >
              <SafeImage
                url={images[2]}
                style={styles.fillImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 4+ IMAGES: 2x2 Grid (Top 2, Bottom 2) with +N Badge for > 4
  const displayImages = images.slice(0, 4);
  const remainingCount = images.length - 3;

  return (
    <View
      style={[
        styles.container,
        {
          height: height || 230,
          borderColor: containerBorderColor,
          backgroundColor: dividerColor,
        },
        style,
      ]}
    >
      <View style={[styles.col, { gap: 3 }]}>
        {/* Top Row: Images 0 and 1 */}
        <View style={[styles.row, { gap: 3 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(0)}
            style={styles.flex1}
          >
            <SafeImage
              url={displayImages[0]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(1)}
            style={styles.flex1}
          >
            <SafeImage
              url={displayImages[1]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Row: Images 2 and 3 (+N overlay if > 4) */}
        <View style={[styles.row, { gap: 3 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(2)}
            style={styles.flex1}
          >
            <SafeImage
              url={displayImages[2]}
              style={styles.fillImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(3)}
            style={styles.flex1}
          >
            <SafeImage
              url={displayImages[3]}
              style={styles.fillImage}
              resizeMode="cover"
            />
            {images.length > 4 && (
              <View style={styles.badgeOverlay}>
                <Text style={styles.badgeText}>+{remainingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  flex1: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    flexDirection: 'column',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
