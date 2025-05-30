# Push Notifications System - Feature Deep Dive

## 1.1 Feature Goal

The Push Notifications System provides real-time engagement and awareness for the Chore Takeover System:

### User-visible Value:
- **Proactive Alerts**: Instant notifications when chores become takeover-eligible
- **Achievement Celebrations**: Push notifications for Helper Hero milestones
- **Admin Workflow**: Immediate alerts for high-value takeover requests needing approval
- **Family Coordination**: Keep everyone informed of takeover activities in real-time
- **Engagement Boost**: Timely nudges increase family participation and response rates

## 1.2 Logic Breakdown

### Notification Types & Rules
1. **Chore Takeover Eligible**:
   - Trigger: Chore becomes overdue (24+ hours)
   - Recipients: All active family members except original assignee
   - Frequency: Once per chore, with 6-hour reminders if not taken
   - Content: "Kitchen cleaning is available for takeover (+5 bonus points!)"

2. **Helper Hero Achievement**:
   - Trigger: User reaches 10 takeovers milestone
   - Recipients: Achieving user + family admins
   - Frequency: Once per achievement
   - Content: "🦸 Sarah unlocked Helper Hero! 10 chores taken over!"

3. **Admin Approval Required**:
   - Trigger: High-value chore takeover (100+ points)
   - Recipients: Family admins only
   - Frequency: Immediate + 2-hour reminder if not approved
   - Content: "Takeover approval needed: Deep clean garage (150 pts)"

4. **Takeover Completed**:
   - Trigger: Taken-over chore is completed
   - Recipients: Original assignee + family admins
   - Content: "John completed your kitchen cleaning (+20 XP bonus!)"

5. **Daily Helper Summary**:
   - Trigger: End of day if takeovers occurred
   - Recipients: All family members
   - Content: "Today's helpers: Sarah (2), Mike (1). Great teamwork!"

### Permission & Filtering Rules
- Users can disable specific notification types in settings
- Quiet hours: No notifications between 9 PM - 7 AM (user timezone)
- Smart grouping: Bundle multiple similar notifications
- Priority levels: Achievement > Admin > Takeover > Summary

### Edge Cases
- Offline users: Queue notifications for delivery when online
- Deleted chores: Cancel pending notifications
- Family removal: Immediately revoke all notification permissions
- Mock mode: Show in-app notifications instead of system push

## 1.3 Ripple Map

### New Files to Create
1. **Notification Service** (`services/`):
   - `notificationService.ts` - Core notification logic
   - `pushNotificationConfig.ts` - Expo notifications setup
   - `notificationTemplates.ts` - Message templates and formatting

2. **Cloud Functions** (`functions/src/`):
   - `triggers/takeoverNotifications.ts` - Firestore trigger functions
   - `scheduled/dailySummaryNotifications.ts` - Daily summary job
   - `utils/notificationUtils.ts` - Helper functions

3. **Components** (`components/`):
   - `NotificationSettings.tsx` - User preference controls
   - `NotificationPermissionRequest.tsx` - Permission prompt
   - `InAppNotificationBanner.tsx` - Fallback for mock mode

4. **Hooks** (`hooks/`):
   - `useNotifications.ts` - Notification state management
   - `usePushPermissions.ts` - Permission handling

### Files to Modify
1. **Settings Screen** (`app/(tabs)/settings.tsx`):
   - Add notification preferences section
   - Toggle controls for each notification type

2. **Family Store** (`stores/familyStore.ts`):
   - Add notification preferences to user state
   - Track notification permissions

3. **App Layout** (`app/_layout.tsx`):
   - Initialize notification service
   - Handle notification taps and routing

4. **Takeover Sync Service** (`services/takeoverSyncService.ts`):
   - Trigger notifications on successful takeovers
   - Queue achievement notifications

5. **Types** (`types/index.ts`):
   - Add notification interfaces and settings

### External Dependencies
- **Expo Notifications**: For cross-platform push notifications
- **Firebase Cloud Messaging**: Backend notification delivery
- **Firestore Triggers**: Real-time notification triggers

## 1.4 UX & Engagement Uplift

### Immediate Value
1. **Reduced Response Time**: 
   - Average takeover response time drops from 6+ hours to 2 hours
   - Family members learn about overdue chores instantly

2. **Achievement Recognition**:
   - Helper Hero celebrations increase motivation
   - Public recognition encourages continued helping behavior

3. **Admin Efficiency**:
   - High-value takeover approvals processed in minutes vs hours
   - Clear action items with one-tap approval

### Behavioral Changes
1. **Proactive Helping**:
   - Notifications create FOMO around helping opportunities
   - Gamified alerts make takeovers feel rewarding

2. **Family Awareness**:
   - Everyone sees who's helping and when
   - Builds culture of mutual support and appreciation

3. **Admin Oversight**:
   - Real-time visibility into family collaboration
   - Quick intervention when approval needed

### Engagement Metrics
- **Notification CTR**: Target 60%+ click-through rate
- **Takeover Response Time**: Target 50% improvement
- **Helper Participation**: Target 25% more unique helpers monthly

## 1.5 Data Model Deltas

### New TypeScript Interfaces
```typescript
// Notification preferences
interface NotificationSettings {
  enabled: boolean;
  types: {
    choreAvailable: boolean;
    achievementUnlocked: boolean;
    adminApprovalNeeded: boolean;
    takeoverCompleted: boolean;
    dailySummary: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // "21:00"
    endTime: string;   // "07:00"
  };
  sound: boolean;
  vibration: boolean;
}

// Notification record
interface PushNotification {
  id: string;
  type: 'chore_available' | 'achievement' | 'admin_approval' | 'takeover_completed' | 'daily_summary';
  recipientId: string;
  familyId: string;
  title: string;
  body: string;
  data: {
    choreId?: string;
    achievementId?: string;
    takeoverId?: string;
    actionUrl?: string;
  };
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  clickedAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'clicked' | 'failed';
  expoTickets?: string[];
  priority: 'low' | 'normal' | 'high';
}

// Enhanced User interface
interface User {
  // ... existing fields ...
  notificationSettings?: NotificationSettings;
  expoPushToken?: string;
  notificationPermission?: 'granted' | 'denied' | 'undetermined';
  lastNotificationAt?: string;
}
```

### Firestore Collections
```json
// notifications/{notificationId}
{
  "id": "notif_123",
  "type": "chore_available",
  "recipientId": "user_456",
  "familyId": "family_789",
  "title": "Chore Available for Takeover",
  "body": "Kitchen cleaning is overdue and available (+5 bonus points!)",
  "data": {
    "choreId": "chore_123",
    "actionUrl": "/chores?highlight=chore_123"
  },
  "scheduledFor": "2025-05-29T15:30:00Z",
  "sentAt": "2025-05-29T15:30:05Z",
  "status": "sent",
  "priority": "normal",
  "expoTickets": ["ticket_abc123"],
  "createdAt": "2025-05-29T15:29:55Z"
}

// expo_push_tokens/{userId}
{
  "userId": "user_456",
  "token": "ExponentPushToken[abc123...]",
  "deviceType": "ios",
  "appVersion": "2.5.0",
  "lastUpdated": "2025-05-29T10:00:00Z",
  "isActive": true
}
```

## 1.6 Acceptance Checklist

### Core Functionality
- [ ] Chore takeover eligible notifications sent within 5 minutes
- [ ] Helper Hero achievement notifications delivered instantly
- [ ] Admin approval requests sent to all admins immediately
- [ ] Notification permissions requested on first app launch
- [ ] Users can customize notification types in settings
- [ ] Quiet hours respected (no notifications 9 PM - 7 AM)

### Cross-Platform Support
- [ ] iOS push notifications work with proper certificates
- [ ] Android notifications display with app icon and actions
- [ ] Web notifications work in supported browsers
- [ ] Mock mode shows in-app notifications instead of push
- [ ] Offline notification queue syncs when back online

### User Experience
- [ ] Notification taps navigate to relevant app screen
- [ ] Clear, actionable notification text with bonus info
- [ ] Achievement notifications include celebration emojis
- [ ] Admin notifications have approve/deny action buttons
- [ ] Daily summaries are informative and positive

### Data & Privacy
- [ ] Push tokens securely stored and regularly refreshed
- [ ] Notification history tracked for analytics
- [ ] Users can disable all notifications
- [ ] Uninstall/logout removes push tokens from server
- [ ] No sensitive data in notification content

### Error Handling
- [ ] Failed notification delivery logged and retried
- [ ] Invalid push tokens automatically removed
- [ ] Graceful fallback when Expo services unavailable
- [ ] Network failures don't block app functionality
- [ ] Clear error messages for permission issues

### Performance
- [ ] Notification processing doesn't block UI
- [ ] Batch sending for multiple recipients
- [ ] Efficient Firestore queries for notification history
- [ ] Memory usage stays stable with notification service
- [ ] Background processing on device respects battery optimization