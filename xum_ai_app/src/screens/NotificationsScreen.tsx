import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { NotificationService, PushNotification } from '../services/notificationService';
import { Header } from '../components/Shared';

interface NotificationsScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onBack?: () => void;
  session?: { user: any };
  onUnreadCountChange?: (count: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  general: 'notifications',
  task: 'assignment',
  payment: 'account-balance-wallet',
  system: 'settings',
  admin: 'admin-panel-settings',
  promo: 'local-offer',
  announcements: 'campaign',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: '#6366f1',
  task: '#f59e0b',
  payment: '#10b981',
  system: '#8b5cf6',
  admin: '#ef4444',
  promo: '#ec4899',
  announcements: '#3b82f6',
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigate,
  onBack,
  session,
  onUnreadCountChange,
}) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = session?.user?.id;

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await NotificationService.getNotifications(userId, { limit: 50 });
      setNotifications(data);

      const count = data.filter((n) => !n.read).length;
      onUnreadCountChange?.(count);
      await NotificationService.setBadgeCount(count);
    } catch (err) {
      console.error('[NotificationsScreen] Error loading:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, onUnreadCountChange]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: PushNotification) => {
    // Mark as read
    if (!notification.read) {
      await NotificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      );
      const newCount = notifications.filter((n) => !n.read && n.id !== notification.id).length;
      onUnreadCountChange?.(newCount);
      await NotificationService.setBadgeCount(newCount);
    }

    // Navigate to target screen if specified in data
    if (notification.data?.screen && ScreenName[notification.data.screen as keyof typeof ScreenName]) {
      onNavigate(ScreenName[notification.data.screen as keyof typeof ScreenName]);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await NotificationService.markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })));
    onUnreadCountChange?.(0);
    await NotificationService.clearBadge();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotificationItem = (notification: PushNotification) => {
    const iconName = CATEGORY_ICONS[notification.category] || 'notifications';
    const iconColor = CATEGORY_COLORS[notification.category] || theme.primary;

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          {
            backgroundColor: notification.read ? theme.surface : `${theme.primary}10`,
            borderColor: notification.read ? theme.border : `${theme.primary}30`,
          },
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        {/* Unread indicator */}
        {!notification.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        )}

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <MaterialIcons name={iconName as any} size={22} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.notificationTitle,
                { color: theme.text, fontWeight: notification.read ? '500' : '700' },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {timeAgo(notification.created_at)}
            </Text>
          </View>
          <Text
            style={[styles.notificationBody, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
          {notification.category !== 'general' && (
            <View style={[styles.categoryBadge, { backgroundColor: `${iconColor}15` }]}>
              <Text style={[styles.categoryText, { color: iconColor }]}>
                {notification.category.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Header
        title="NOTIFICATIONS"
        onBack={() => (onBack ? onBack() : onNavigate(ScreenName.HOME))}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
              <MaterialIcons name="done-all" size={22} color={theme.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="notifications-none" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notifications</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            You&apos;re all caught up! New notifications will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <View style={[styles.unreadBanner, { backgroundColor: `${theme.primary}15` }]}>
              <MaterialIcons name="mark-email-unread" size={18} color={theme.primary} />
              <Text style={[styles.unreadBannerText, { color: theme.primary }]}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {notifications.map(renderNotificationItem)}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
  },
  markAllButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  unreadBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
