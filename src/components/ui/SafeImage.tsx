import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  View,
  StyleSheet,
} from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import { getDefaultApiBaseUrl } from '../../constants/config';
import { getCachedAuthToken } from '../../services/api';
import { isVideoUrl } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  url?: string | null;
  style?: StyleProp<ImageStyle>;
  fallbackIcon?: React.ReactNode;
  fallbackStyle?: StyleProp<any>;
}

// Global cache of URLs that required the backend proxy to load successfully
const proxyFallbackUrls = new Set<string>();

export function getProxyImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;
  const baseUrl = getDefaultApiBaseUrl();
  const token = getCachedAuthToken();
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  return `${baseUrl}/proxy-image?url=${encodeURIComponent(rawUrl)}${tokenParam}`;
}

export const SafeImage: React.FC<SafeImageProps> = React.memo(({
  url,
  style,
  resizeMode = 'cover',
  fallbackIcon,
  fallbackStyle,
  ...restProps
}) => {
  const { isDark } = useTheme();

  // If url is empty or points to a video stream (.mp4), it's not a valid image
  const isValidImageUrl = Boolean(url && typeof url === 'string' && url.trim() && !isVideoUrl(url));

  const [currentUri, setCurrentUri] = useState<string | null>(() => {
    if (!isValidImageUrl || !url) return null;
    if (proxyFallbackUrls.has(url)) {
      return getProxyImageUrl(url);
    }
    return url;
  });

  const [hasError, setHasError] = useState(!isValidImageUrl);

  useEffect(() => {
    if (!isValidImageUrl || !url) {
      setCurrentUri(null);
      setHasError(true);
      return;
    }
    if (proxyFallbackUrls.has(url)) {
      setCurrentUri(getProxyImageUrl(url));
    } else {
      setCurrentUri(url);
    }
    setHasError(false);
  }, [url, isValidImageUrl]);

  const handleError = () => {
    if (url && currentUri === url && !url.includes('/proxy-image?url=')) {
      // Direct CDN load failed (e.g. 403 Forbidden, hotlink protection). Try backend proxy fallback!
      proxyFallbackUrls.add(url);
      setCurrentUri(getProxyImageUrl(url));
    } else {
      // Proxy also failed or invalid URL
      if (url) proxyFallbackUrls.delete(url);
      setHasError(true);
    }
  };

  if (!isValidImageUrl || !currentUri || hasError) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          { backgroundColor: isDark ? '#1C1917' : '#F5F2EB' },
          style as any,
          fallbackStyle,
        ]}
      >
        {fallbackIcon || (
          <ImageIcon
            size={24}
            color={isDark ? '#524B43' : '#B5ADA4'}
          />
        )}
      </View>
    );
  }

  const token = getCachedAuthToken();
  const headers = currentUri.includes('/proxy-image') && token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  return (
    <Image
      source={{ uri: currentUri, headers }}
      style={style}
      resizeMode={resizeMode}
      onError={handleError}
      {...restProps}
    />
  );
});

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
