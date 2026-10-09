import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export interface CarouselNavButtonsProps {
  activeIndex: number;
  total: number;
  onPrev: (e?: GestureResponderEvent) => void;
  onNext: (e?: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

export const CarouselPrevButton: React.FC<{
  onPress: (e?: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, style }) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={(e) => {
        e?.stopPropagation?.();
        onPress(e);
      }}
      style={[
        styles.navButton,
        styles.prevButton,
        {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        },
        style,
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel="Previous slide"
      accessibilityRole="button"
    >
      <ChevronLeft
        size={16}
        color={isDark ? '#FFFFFF' : '#1A1816'}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
};

export const CarouselNextButton: React.FC<{
  onPress: (e?: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}> = ({ onPress, style }) => {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={(e) => {
        e?.stopPropagation?.();
        onPress(e);
      }}
      style={[
        styles.navButton,
        styles.nextButton,
        {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.78)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        },
        style,
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel="Next slide"
      accessibilityRole="button"
    >
      <ChevronRight
        size={16}
        color={isDark ? '#FFFFFF' : '#1A1816'}
        strokeWidth={2.5}
      />
    </TouchableOpacity>
  );
};

export const CarouselNavButtons: React.FC<CarouselNavButtonsProps> = ({
  activeIndex,
  total,
  onPrev,
  onNext,
  style,
}) => {
  if (total <= 1) return null;

  return (
    <>
      {activeIndex > 0 && (
        <CarouselPrevButton onPress={onPrev} style={style} />
      )}
      {activeIndex < total - 1 && (
        <CarouselNextButton onPress={onNext} style={style} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    zIndex: 25,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  prevButton: {
    left: 8,
  },
  nextButton: {
    right: 8,
  },
});
