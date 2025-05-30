import { notificationService } from '../services/notificationService';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Mock expo-notifications and expo-device
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  db: {},
  getUsersCollection: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (notificationService as any).isInitialized = false;
    (notificationService as any).currentToken = null;
  });

  describe('requestPermissions', () => {
    it('should return granted when permissions are already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();
      expect(result).toBe('granted');
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should request permissions when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await notificationService.requestPermissions();
      expect(result).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should return denied when permissions are denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
    });

    it('should return denied on simulator', async () => {
      (Device.isDevice as any) = false;

      const result = await notificationService.requestPermissions();
      expect(result).toBe('denied');
      expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('registerForPushNotifications', () => {
    beforeEach(() => {
      (Device.isDevice as any) = true;
    });

    it('should return push token when successful', async () => {
      const mockToken = 'ExponentPushToken[test-token]';
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });

      const result = await notificationService.registerForPushNotifications();
      expect(result).toBe(mockToken);
    });

    it('should return null on simulator', async () => {
      (Device.isDevice as any) = false;

      const result = await notificationService.registerForPushNotifications();
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Token fetch failed')
      );

      const result = await notificationService.registerForPushNotifications();
      expect(result).toBeNull();
    });
  });

  describe('notification settings validation', () => {
    const mockSettings = {
      enabled: true,
      types: {
        choreAvailable: true,
        achievementUnlocked: false,
        adminApprovalNeeded: true,
        takeoverCompleted: true,
        dailySummary: false,
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
      },
      sound: true,
      vibration: true,
    };

    it('should respect notification type settings', () => {
      const shouldSend = (notificationService as any).shouldSendNotification;
      
      expect(shouldSend(mockSettings, 'chore_available')).toBe(true);
      expect(shouldSend(mockSettings, 'achievement_unlocked')).toBe(false);
      expect(shouldSend(mockSettings, 'admin_approval_needed')).toBe(true);
      expect(shouldSend(mockSettings, 'takeover_completed')).toBe(true);
      expect(shouldSend(mockSettings, 'daily_summary')).toBe(false);
    });

    it('should respect master enabled setting', () => {
      const disabledSettings = { ...mockSettings, enabled: false };
      const shouldSend = (notificationService as any).shouldSendNotification;
      
      expect(shouldSend(disabledSettings, 'chore_available')).toBe(false);
      expect(shouldSend(disabledSettings, 'admin_approval_needed')).toBe(false);
    });

    it('should detect quiet hours correctly', () => {
      const isQuietHours = (notificationService as any).isQuietHours;
      
      // Mock current time to 23:30 (11:30 PM)
      const mockDate = new Date();
      mockDate.setHours(23, 30, 0, 0);
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      expect(isQuietHours(mockSettings)).toBe(true);
      
      // Mock current time to 14:30 (2:30 PM)
      mockDate.setHours(14, 30, 0, 0);
      expect(isQuietHours(mockSettings)).toBe(false);
      
      // Mock current time to 05:00 (5:00 AM)
      mockDate.setHours(5, 0, 0, 0);
      expect(isQuietHours(mockSettings)).toBe(true);
      
      jest.restoreAllMocks();
    });

    it('should handle quiet hours disabled', () => {
      const noQuietSettings = {
        ...mockSettings,
        quietHours: { ...mockSettings.quietHours, enabled: false },
      };
      const isQuietHours = (notificationService as any).isQuietHours;
      
      expect(isQuietHours(noQuietSettings)).toBe(false);
    });
  });

  describe('template formatting', () => {
    it('should format notification templates correctly', () => {
      const formatTemplate = (notificationService as any).formatTemplate;
      
      const template = 'Hello {userName}, you earned {points} points for {choreTitle}!';
      const data = {
        userName: 'John',
        points: 25,
        choreTitle: 'Kitchen Cleaning',
      };
      
      const result = formatTemplate(template, data);
      expect(result).toBe('Hello John, you earned 25 points for Kitchen Cleaning!');
    });

    it('should handle missing data gracefully', () => {
      const formatTemplate = (notificationService as any).formatTemplate;
      
      const template = 'Hello {userName}, your score is {score}';
      const data = { userName: 'John' }; // Missing score
      
      const result = formatTemplate(template, data);
      expect(result).toBe('Hello John, your score is undefined');
    });
  });

  describe('action URL generation', () => {
    it('should generate correct URLs for different notification types', () => {
      const getActionUrl = (notificationService as any).getActionUrl;
      
      expect(getActionUrl('chore_available', { choreId: 'chore123' }))
        .toBe('/chores?highlight=chore123');
      
      expect(getActionUrl('achievement_unlocked', {}))
        .toBe('/achievements');
      
      expect(getActionUrl('admin_approval_needed', { takeoverId: 'takeover456' }))
        .toBe('/admin/takeover-approvals?id=takeover456');
      
      expect(getActionUrl('takeover_completed', { choreId: 'chore789' }))
        .toBe('/chores?completed=chore789');
      
      expect(getActionUrl('daily_summary', {}))
        .toBe('/analytics');
    });
  });
});