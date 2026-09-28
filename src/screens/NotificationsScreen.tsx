import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Bell,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Share2,
  Trash2,
  CheckCheck,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ai' | 'credit' | 'share' | 'welcome';
}

interface NotificationsScreenProps {
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
  onNavigateHome?: () => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'AI Context Generated',
    message: 'Visual entities and smart tags are ready for your recently saved bookmark.',
    timestamp: '10m ago',
    read: false,
    type: 'ai',
  },
  {
    id: 'notif_2',
    title: 'Weekly Credits Reset',
    message: 'Your free AI credits have been refreshed. Enjoy exploring your mindspace!',
    timestamp: '2h ago',
    read: false,
    type: 'credit',
  },
  {
    id: 'notif_3',
    title: 'Share Extension Ready',
    message: 'Share links directly from Safari, Chrome, and X to Mindspace using the system share sheet.',
    timestamp: '1d ago',
    read: true,
    type: 'share',
  },
  {
    id: 'notif_4',
    title: 'Welcome to Mindspace',
    message: 'Organize your mind, save articles, and extract intelligence effortlessly.',
    timestamp: '3d ago',
    read: true,
    type: 'welcome',
  },
];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onShowToast,
  onNavigateHome,
}) => {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onShowToast?.('All notifications marked as read', 'success');
  };

  const handleClearAll = () => {
    setNotifications([]);
    onShowToast?.('Notifications cleared');
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ai':
        return <Sparkles size={18} color={colors.primary} />;
      case 'credit':
        return <RefreshCw size={18} color={colors.primary} />;
      case 'share':
        return <Share2 size={18} color={colors.primary} />;
      default:
        return <CheckCircle2 size={18} color={colors.primary} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.screenTitle,
              {
                color: colors.textHeading,
                fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
              },
            ]}
          >
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Mark all as read"
              >
                <CheckCheck size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                  Mark read
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClearAll}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear all notifications"
            >
              <Trash2 size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleToggleRead(item.id)}
            activeOpacity={0.75}
            style={[
              styles.notifCard,
              {
                backgroundColor: item.read
                  ? colors.card
                  : isDark
                    ? 'rgba(38, 33, 28, 0.7)'
                    : 'rgba(255, 255, 255, 0.95)',
                borderColor: item.read
                  ? colors.border
                  : isDark
                    ? 'rgba(200, 142, 62, 0.35)'
                    : 'rgba(181, 129, 76, 0.3)',
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: item.read
                    ? colors.accentBg
                    : isDark
                      ? 'rgba(200, 142, 62, 0.15)'
                      : 'rgba(181, 129, 76, 0.12)',
                },
              ]}
            >
              {renderIcon(item.type)}
            </View>

            <View style={styles.notifBody}>
              <View style={styles.notifTopRow}>
                <Text
                  style={[
                    styles.notifTitle,
                    {
                      color: colors.textHeading,
                      fontWeight: item.read ? '600' : '700',
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textMuted }]}>
                  {item.timestamp}
                </Text>
              </View>

              <Text
                style={[
                  styles.notifMessage,
                  {
                    color: item.read ? colors.textMuted : colors.textBody,
                  },
                ]}
              >
                {item.message}
              </Text>
            </View>

            {!item.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: colors.accentBg },
              ]}
            >
              <Bell size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textHeading }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No new notifications right now. We will notify you when AI extracts summaries or credits are updated.
            </Text>
            {onNavigateHome && (
              <TouchableOpacity
                onPress={onNavigateHome}
                style={[styles.emptyHomeBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyHomeBtnText}>Go to Feed</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBody: {
    flex: 1,
    gap: 4,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
  notifTime: {
    fontSize: 11,
  },
  notifMessage: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  emptyHomeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
