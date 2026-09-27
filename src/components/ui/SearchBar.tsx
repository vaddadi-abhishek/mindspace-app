import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search your mind...',
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: isFocused
            ? colors.primary
            : isDark
            ? 'rgba(200, 142, 62, 0.35)'
            : 'rgba(181, 129, 76, 0.35)',
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: colors.textHeading,
            fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(126, 117, 105, 0.7)' : 'rgba(140, 131, 119, 0.7)'}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <X size={15} color={colors.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: 6,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontStyle: 'italic',
    paddingVertical: 0,
    letterSpacing: -0.2,
  },
  clearBtn: {
    padding: 3,
    marginLeft: 4,
  },
});
