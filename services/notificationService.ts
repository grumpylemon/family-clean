// Notification Service - Cross-platform push notification management
// Handles Expo notifications, permission requests, and message delivery

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { 
  doc, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, getUsersCollection } from '@/config/firebase';
import { 
  NotificationType, 
  NotificationSettings, 
  PushNotification,
  NotificationTemplate,
} from '@/types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  types: {
    choreAvailable: true,
    achievementUnlocked: true,
    adminApprovalNeeded: true,
    takeoverCompleted: true,
    dailySummary: true,
  },
  quietHours: {
    enabled: true,
    startTime: '21:00',
    endTime: '07:00',
  },
  sound: true,
  vibration: true,
};

// Notification templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  chore_available: {
    type: 'chore_available',
    title: 'Chore Available for Takeover',
    body: '{choreTitle} is overdue and available (+{bonusPoints} bonus points!)',
    priority: 'normal',
    sound: true,
  },
  achievement_unlocked: {
    type: 'achievement_unlocked',
    title: '🎉 Achievement Unlocked!',
    body: '{userName} earned {achievementName}! {achievementDescription}',
    priority: 'high',
    sound: true,
    vibration: true,
  },
  admin_approval_needed: {
    type: 'admin_approval_needed',
    title: 'Takeover Approval Needed',
    body: '{userName} wants to takeover "{choreTitle}" ({chorePoints} pts)',
    priority: 'high',
    actions: [
      { id: 'approve', title: 'Approve', type: 'default' },
      { id: 'deny', title: 'Deny', type: 'destructive' },
    ],
  },
  takeover_completed: {
    type: 'takeover_completed',
    title: 'Chore Completed by Helper',
    body: '{helperName} completed "{choreTitle}" for you (+{bonusXP} XP)',
    priority: 'normal',
  },
  daily_summary: {
    type: 'daily_summary',
    title: 'Daily Helper Summary',
    body: 'Today\'s helpers: {helperSummary}. Great teamwork!',
    priority: 'low',
  },
};

class NotificationService {
  private isInitialized = false;
  private currentToken: string | null = null;

  // Initialize notification service
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const permission = await this.requestPermissions();
      
      if (permission === 'granted') {
        // Get push token
        const token = await this.registerForPushNotifications();
        
        if (token && userId) {
          // Store token in user document
          await this.updateUserPushToken(userId, token);
          this.currentToken = token;
        }
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('✅ NotificationService: Initialized successfully');
      
    } catch (error) {
      console.error('❌ NotificationService: Initialization failed:', error);
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (!Device.isDevice) {
      console.log('Notifications not supported on simulator');
      return 'denied';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus as 'granted' | 'denied' | 'undetermined';
  }

  // Register for push notifications and get token
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Push token obtained:', token);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#be185d',
        });

        // Achievement channel
        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
          sound: 'default',
        });

        // Admin channel
        await Notifications.setNotificationChannelAsync('admin', {
          name: 'Admin Approvals',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#f59e0b',
        });
      }

      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Update user's push token in database
  async updateUserPushToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(getUsersCollection()!, userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        notificationPermission: 'granted',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update push token:', error);
    }
  }

  // Send a notification
  async sendNotification(
    recipientIds: string[],
    type: NotificationType,
    data: Record<string, any>,
    familyId: string
  ): Promise<void> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        console.error('Unknown notification type:', type);
        return;
      }

      // Get recipients with their tokens and settings
      const recipients = await this.getRecipientsWithTokens(recipientIds);
      
      for (const recipient of recipients) {
        // Check if notifications are enabled for this type
        if (!this.shouldSendNotification(recipient.settings, type)) {
          continue;
        }

        // Check quiet hours
        if (this.isQuietHours(recipient.settings)) {
          console.log(`Skipping notification for ${recipient.userId} (quiet hours)`);
          continue;
        }

        // Create notification record
        const notification = await this.createNotificationRecord({
          type,
          recipientId: recipient.userId,
          familyId,
          title: this.formatTemplate(template.title, data),
          body: this.formatTemplate(template.body, data),
          data: {
            ...data,
            actionUrl: this.getActionUrl(type, data),
          },
          priority: template.priority,
        });

        // Send push notification
        if (recipient.token) {
          await this.sendPushNotification(recipient.token, notification, template);
        }
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Create notification record in Firestore
  private async createNotificationRecord(
    notificationData: Omit<PushNotification, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<PushNotification> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...notificationData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Send actual push notification via Expo
  private async sendPushNotification(
    token: string,
    notification: PushNotification,
    template: NotificationTemplate
  ): Promise<void> {
    try {
      const message = {
        to: token,
        sound: template.sound ? 'default' : undefined,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channelId: this.getChannelId(notification.type),
        priority: notification.priority,
      };

      console.log('📤 Sending push notification:', message);
      
      // For now, we'll use local notifications in development
      if (__DEV__) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: template.sound,
          },
          trigger: null, // Immediate
        });
      }
      
      // TODO: In production, use Expo's push API or Firebase Cloud Functions
      
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Get recipients with their push tokens and settings
  private async getRecipientsWithTokens(recipientIds: string[]): Promise<Array<{
    userId: string;
    token?: string;
    settings: NotificationSettings;
  }>> {
    try {
      const usersQuery = query(
        getUsersCollection()!,
        where('uid', 'in', recipientIds)
      );
      
      const snapshot = await getDocs(usersQuery);
      
      return snapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          userId: doc.id,
          token: userData.expoPushToken,
          settings: userData.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS,
        };
      });
    } catch (error) {
      console.error('Failed to get recipients:', error);
      return [];
    }
  }

  // Check if notification should be sent based on user settings
  private shouldSendNotification(
    settings: NotificationSettings,
    type: NotificationType
  ): boolean {
    if (!settings.enabled) return false;

    switch (type) {
      case 'chore_available':
        return settings.types.choreAvailable;
      case 'achievement_unlocked':
        return settings.types.achievementUnlocked;
      case 'admin_approval_needed':
        return settings.types.adminApprovalNeeded;
      case 'takeover_completed':
        return settings.types.takeoverCompleted;
      case 'daily_summary':
        return settings.types.dailySummary;
      default:
        return true;
    }
  }

  // Check if it's currently quiet hours
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const startTime = parseInt(settings.quietHours.startTime.replace(':', ''));
    const endTime = parseInt(settings.quietHours.endTime.replace(':', ''));

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // Format notification template with data
  private formatTemplate(template: string, data: Record<string, any>): string {
    let formatted = template;
    
    Object.entries(data).forEach(([key, value]) => {
      formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
    
    return formatted;
  }

  // Get action URL for notification type
  private getActionUrl(type: NotificationType, data: Record<string, any>): string {
    switch (type) {
      case 'chore_available':
        return `/chores?highlight=${data.choreId}`;
      case 'achievement_unlocked':
        return '/achievements';
      case 'admin_approval_needed':
        return `/admin/takeover-approvals?id=${data.takeoverId}`;
      case 'takeover_completed':
        return `/chores?completed=${data.choreId}`;
      case 'daily_summary':
        return '/analytics';
      default:
        return '/';
    }
  }

  // Get notification channel ID for Android
  private getChannelId(type: NotificationType): string {
    switch (type) {
      case 'achievement_unlocked':
        return 'achievements';
      case 'admin_approval_needed':
        return 'admin';
      default:
        return 'default';
    }
  }

  // Set up notification listeners
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data?.actionUrl) {
        // TODO: Navigate to action URL using router
        console.log('Navigate to:', data.actionUrl);
      }
    });
  }

  // Update user notification settings
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      const userRef = doc(getUsersCollection()!, userId);
      await updateDoc(userRef, {
        notificationSettings: settings,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  // Get current push token
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Clear notifications for user (on logout)
  async clearUserNotifications(userId: string): Promise<void> {
    try {
      const userRef = doc(getUsersCollection()!, userId);
      await updateDoc(userRef, {
        expoPushToken: null,
        notificationPermission: 'undetermined',
        updatedAt: new Date().toISOString(),
      });
      
      this.currentToken = null;
    } catch (error) {
      console.error('Failed to clear user notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Helper functions for common notification scenarios
export const sendChoreAvailableNotification = async (
  choreId: string,
  choreTitle: string,
  bonusPoints: number,
  familyMembers: string[],
  familyId: string,
  excludeUserId?: string
) => {
  const recipients = excludeUserId 
    ? familyMembers.filter(id => id !== excludeUserId)
    : familyMembers;

  await notificationService.sendNotification(
    recipients,
    'chore_available',
    { choreId, choreTitle, bonusPoints },
    familyId
  );
};

export const sendAchievementNotification = async (
  userId: string,
  userName: string,
  achievementName: string,
  achievementDescription: string,
  familyMembers: string[],
  familyId: string
) => {
  await notificationService.sendNotification(
    [userId, ...familyMembers.filter(id => id !== userId)],
    'achievement_unlocked',
    { userId, userName, achievementName, achievementDescription },
    familyId
  );
};

export const sendAdminApprovalNotification = async (
  takeoverId: string,
  userName: string,
  choreTitle: string,
  chorePoints: number,
  adminIds: string[],
  familyId: string
) => {
  await notificationService.sendNotification(
    adminIds,
    'admin_approval_needed',
    { takeoverId, userName, choreTitle, chorePoints },
    familyId
  );
};

export const sendTakeoverCompletedNotification = async (
  originalAssigneeId: string,
  helperName: string,
  choreTitle: string,
  bonusXP: number,
  familyId: string
) => {
  await notificationService.sendNotification(
    [originalAssigneeId],
    'takeover_completed',
    { helperName, choreTitle, bonusXP },
    familyId
  );
};