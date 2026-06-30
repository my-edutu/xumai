/**
 * XUM AI - Push Notification Service
 *
 * Handles:
 * - Permission requests
 * - Expo push token registration
 * - Token storage to Supabase
 * - Notification listeners (foreground + background + tap)
 * - Notification history from Supabase
 * - Mark as read / unread count
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ============================================================================
// BACKGROUND NOTIFICATION TASK
// ============================================================================

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundNotification] Error:', error);
    return;
  }
  if (data) {
    const notification = (data as any).notification;
    const badgeCount = notification?.request?.content?.badge;
    if (typeof badgeCount === 'number') {
      await Notifications.setBadgeCountAsync(badgeCount);
    }
  }
});

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  data: Record<string, any>;
  image_url: string | null;
  category: string;
  priority: string;
  status: string;
  read: boolean;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  topic_id: string;
  enabled: boolean;
}

// ============================================================================
// CONFIGURE DEFAULT NOTIFICATION BEHAVIOR
// ============================================================================

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================================================
// HELPERS
// ============================================================================

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export const NotificationService = {
  // --------------------------------------------------------------------------
  // PERMISSIONS & TOKEN
  // --------------------------------------------------------------------------

  /**
   * Request notification permissions and return the Expo push token.
   * Returns null if permissions are denied or device is a simulator.
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Set up Android notification channels
    if (Platform.OS === 'android') {
      // Use new channel IDs to ensure updated settings take effect (channels are immutable once created)
      await Notifications.setNotificationChannelAsync('default_v2', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('tasks_v2', {
        name: 'New Tasks',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications about new available tasks',
        sound: 'task_alert.wav',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('payments_v2', {
        name: 'Payments',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Payment and wallet notifications',
        sound: 'payment_chime.wav',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });
    }

    // Register interactive notification categories
    await this.registerNotificationCategories();

    // Register background notification task
    try {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    } catch (err: any) {
      console.warn('[Notifications] Background task registration failed:', err.message);
    }

    // Get the Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      console.log('[Notifications] Push token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.error('[Notifications] Error getting push token:', error);
      return null;
    }
  },

  // --------------------------------------------------------------------------
  // INTERACTIVE NOTIFICATION CATEGORIES
  // --------------------------------------------------------------------------

  async registerNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('task_invitation', [
      { identifier: 'accept', buttonTitle: 'Accept Task', options: { opensAppToForeground: true } },
      { identifier: 'view', buttonTitle: 'View Details', options: { opensAppToForeground: true } },
    ]);

    await Notifications.setNotificationCategoryAsync('payment_received', [
      { identifier: 'view_wallet', buttonTitle: 'View Wallet', options: { opensAppToForeground: true } },
    ]);

    await Notifications.setNotificationCategoryAsync('task_update', [
      { identifier: 'view', buttonTitle: 'View Task', options: { opensAppToForeground: true } },
    ]);
  },

  // --------------------------------------------------------------------------
  // TOKEN STORAGE (SUPABASE)
  // --------------------------------------------------------------------------

  /**
   * Save the push token to Supabase for the given user.
   * Upserts to handle token refreshes gracefully.
   */
  async savePushToken(userId: string, token: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('[Notifications] Supabase not configured, cannot save token');
      return false;
    }

    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token,
            platform: Platform.OS,
            device_name: Device.deviceName || `${Device.brand || 'Unknown'} ${Device.modelName || 'Device'}`,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        );

      if (error) {
        console.error('[Notifications] Error saving push token:', error.message);
        return false;
      }

      console.log('[Notifications] Push token saved for user:', userId);
      return true;
    } catch (err: any) {
      console.error('[Notifications] Network error saving token:', err.message);
      return false;
    }
  },

  /**
   * Deactivate a push token (e.g., on logout)
   */
  async deactivatePushToken(userId: string, token: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      await supabase
        .from('push_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('token', token);
    } catch (err: any) {
      console.warn('[Notifications] Error deactivating token:', err.message);
    }
  },

  /**
   * Remove all push tokens for a user (e.g., on account deletion)
   */
  async removeAllTokens(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);
    } catch (err: any) {
      console.warn('[Notifications] Error removing tokens:', err.message);
    }
  },

  // --------------------------------------------------------------------------
  // NOTIFICATION HISTORY (READ FROM SUPABASE)
  // --------------------------------------------------------------------------

  /**
   * Get notification history for a user
   */
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; category?: string } = {}
  ): Promise<PushNotification[]> {
    if (!isSupabaseConfigured) return [];

    const { limit = 50, offset = 0, category } = options;

    try {
      const fetchFn = async () => {
        let query = supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      };

      const data = await withRetry(fetchFn);

      // Map DB fields to interface
      return (data || []).map((n: any) => ({
        ...n,
        read: n.is_read // Map is_read from DB to read property
      }));
    } catch (err: any) {
      console.error('[Notifications] Network error:', err.message);
      return [];
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) return 0;

    try {
      const fetchFn = async () => {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${userId},user_id.is.null`)
          .eq('is_read', false);

        if (error) throw error;
        return count || 0;
      };

      return await withRetry(fetchFn);
    } catch (err: any) {
      return 0;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (err: any) {
      console.warn('[Notifications] Error marking as read:', err.message);
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('is_read', false);
    } catch (err: any) {
      console.warn('[Notifications] Error marking all as read:', err.message);
    }
  },

  // --------------------------------------------------------------------------
  // NOTIFICATION PREFERENCES
  // --------------------------------------------------------------------------

  /**
   * Get all notification topics with user's preferences
   */
  async getTopicsWithPreferences(userId: string): Promise<
    (NotificationTopic & { enabled: boolean })[]
  > {
    if (!isSupabaseConfigured) return [];

    try {
      // Fetch topics and user preferences in parallel
      const [topicsResult, prefsResult] = await Promise.all([
        supabase.from('notification_topics').select('*').order('name'),
        supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId),
      ]);

      const topics: NotificationTopic[] = topicsResult.data || [];
      const prefs: NotificationPreference[] = prefsResult.data || [];

      // Merge: if user has a preference, use it; otherwise use topic default
      return topics.map((topic) => {
        const userPref = prefs.find((p) => p.topic_id === topic.id);
        return {
          ...topic,
          enabled: userPref ? userPref.enabled : topic.is_default,
        };
      });
    } catch (err: any) {
      console.error('[Notifications] Error fetching topics:', err.message);
      return [];
    }
  },

  /**
   * Update a user's preference for a notification topic
   */
  async updateTopicPreference(
    userId: string,
    topicId: string,
    enabled: boolean
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      await supabase
        .from('user_notification_preferences')
        .upsert(
          {
            user_id: userId,
            topic_id: topicId,
            enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,topic_id' }
        );
    } catch (err: any) {
      console.warn('[Notifications] Error updating preference:', err.message);
    }
  },

  // --------------------------------------------------------------------------
  // BADGE MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Update the app badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (err) {
      // Badge not supported on all platforms
    }
  },

  /**
   * Clear the app badge
   */
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (err) {
      // Badge not supported on all platforms
    }
  },

  // --------------------------------------------------------------------------
  // LOCAL NOTIFICATIONS (for testing / in-app triggers)
  // --------------------------------------------------------------------------

  /**
   * Schedule a local notification immediately
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: { categoryIdentifier?: string; sound?: string; channelId?: string }
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: options?.sound || 'default',
          ...(options?.categoryIdentifier && { categoryIdentifier: options.categoryIdentifier }),
        },
        trigger: null, // Send immediately
      });
    } catch (err: any) {
      console.warn('[Notifications] Error sending local notification:', err.message);
    }
  },

  // --------------------------------------------------------------------------
  // LISTENER SETUP (call from App.tsx)
  // --------------------------------------------------------------------------

  /**
   * Add a listener for notifications received while the app is in the foreground
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add a listener for when the user taps on a notification
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Get the last notification response (if app was opened via notification)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return Notifications.getLastNotificationResponseAsync();
  },
};
