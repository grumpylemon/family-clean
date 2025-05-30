# Chore Takeover System - Feature Deep Dive

## 1.1 Feature Goal

The Chore Takeover System empowers family members to proactively take over uncompleted chores from other members, promoting family collaboration and ensuring important tasks get done. This feature provides:

- **User-visible value**: Family members can claim overdue or abandoned chores, earning bonus points/XP while helping the family
- **Reduced friction**: No more waiting for assigned members to complete overdue tasks
- **Increased engagement**: Gamified takeover mechanics with cooldowns and bonus rewards
- **Family harmony**: Prevents chore bottlenecks and reduces family tension over incomplete tasks

## 1.2 Logic Breakdown

### Core Rules
1. **Eligibility**: A chore becomes available for takeover when:
   - It's overdue by 24+ hours
   - Original assignee hasn't completed it
   - Chore isn't locked (lockedUntil has passed)

2. **Permission Checks**:
   - User must be an active family member
   - User cannot take over their own chores
   - User must have permission to complete chores (not excluded)
   - Admin approval required for high-value chores (100+ points)

3. **Cooldowns**:
   - User can only take over 2 chores per 24-hour period
   - After takeover, original assignee gets 48-hour cooldown on that chore
   - Completed takeover chores have 72-hour lock before reassignment

4. **Bonus System**:
   - Base points + 25% takeover bonus
   - Double XP for takeover completions
   - Special "Helper Hero" achievement for 10 takeovers
   - Streak bonus preserved if completing within 24 hours

### Edge Cases
- Recurring chores: Only current instance can be taken over
- Multiple takeover requests: First-come, first-served with optimistic locking
- Network failures: Queue takeover requests offline, validate on sync
- Partial completions: Original assignee loses partial credit on takeover

## 1.3 Ripple Map

### Files Requiring Changes
1. **Type Definitions** (`types/index.ts`):
   - Add `takeoverHistory` to Chore interface
   - Add `takeoverStats` to FamilyMember
   - New `ChoreTakeover` interface

2. **Store Slices** (`stores/`):
   - `choreSlice.ts`: Add takeover actions and state
   - `offlineSlice.ts`: Handle takeover queue operations
   - `familySlice.ts`: Update member takeover stats

3. **Services** (`services/`):
   - `firestore.ts`: New takeover CRUD operations
   - `gamification.ts`: Calculate takeover bonuses
   - `pointsService.ts`: Handle bonus point allocation

4. **UI Components**:
   - `app/(tabs)/chores.tsx`: Add takeover button and UI
   - New `components/ChoreTakeoverModal.tsx`
   - Update `components/CompletionRewardModal.tsx` for takeover rewards
   - New `components/TakeoverHistory.tsx` for tracking

5. **Hooks**:
   - New `hooks/useChoreTakeover.ts` for takeover logic
   - Update `hooks/useZustandHooks.ts` with takeover selectors

6. **Cloud Functions** (if using):
   - New function for takeover validation
   - Update chore completion to handle takeover flow

### Test Files
- `__tests__/choreTakeover.test.ts`
- `__tests__/takeoverPermissions.test.ts`
- `__tests__/takeoverOffline.test.ts`

## 1.4 UX & Engagement Uplift

### Gamification Hooks
1. **Instant Gratification**: Takeover button appears on overdue chores with bonus preview
2. **Competition**: Leaderboard shows "Most Helpful" based on takeovers
3. **Achievements**: New badges for takeover milestones
4. **Visual Feedback**: Special animation for takeover completions

### Reduced Friction
1. **One-tap takeover**: Simple button on chore cards
2. **Smart notifications**: Alert when chores become takeover-eligible
3. **Bulk takeover**: Select multiple overdue chores at once
4. **Clear status**: Visual indicators for takeover-eligible chores

### Family Dynamics
1. **Accountability**: Shows who originally failed to complete
2. **Recognition**: Celebrates helpers who step up
3. **Fairness**: Prevents gaming with cooldowns and limits
4. **Transparency**: Full takeover history visible to family

## 1.5 Data Model Deltas

### Updated Firestore Shapes

```typescript
// Updated Chore interface
interface Chore {
  // ... existing fields ...
  takeoverEligibleAt?: string; // ISO date when takeover becomes available
  takeoverHistory?: {
    originalAssignee: string;
    takenOverBy: string;
    takenOverAt: string;
    bonusPoints: number;
    bonusXP: number;
  }[];
  isTakenOver?: boolean;
}

// Updated FamilyMember interface
interface FamilyMember {
  // ... existing fields ...
  takeoverStats: {
    choresTakenOver: number;
    totalTakeoverBonus: number;
    lastTakeoverAt?: string;
    takeoverStreak: number;
    dailyTakeoverCount: number;
    dailyTakeoverResetAt: string;
  };
}

// New ChoreTakeover interface
interface ChoreTakeover {
  id: string;
  choreId: string;
  originalAssigneeId: string;
  newAssigneeId: string;
  familyId: string;
  takenOverAt: string;
  reason: 'overdue' | 'abandoned' | 'requested';
  bonusPoints: number;
  bonusXP: number;
  adminApproved?: boolean;
  completedAt?: string;
}

// Achievement addition
interface Achievement {
  // Add to existing achievements
  HELPER_HERO: {
    id: 'helper_hero';
    name: 'Helper Hero';
    description: 'Take over 10 chores from family members';
    icon: '🦸';
    requirement: 10;
    type: 'takeover';
  };
}
```

### Firestore Document Structure
```json
// chores/{choreId}
{
  "title": "Clean kitchen",
  "assignedTo": "user123",
  "dueDate": "2025-05-27T00:00:00Z",
  "isOverdue": true,
  "takeoverEligibleAt": "2025-05-28T00:00:00Z",
  "isTakenOver": false,
  "takeoverHistory": []
}

// takeovers/{takeoverId}
{
  "choreId": "chore123",
  "originalAssigneeId": "user123",
  "newAssigneeId": "user456",
  "familyId": "family789",
  "takenOverAt": "2025-05-28T14:30:00Z",
  "reason": "overdue",
  "bonusPoints": 25,
  "bonusXP": 50,
  "adminApproved": true,
  "completedAt": null
}
```

## 1.6 Acceptance Checklist

### Core Functionality
- [ ] Overdue chores show takeover button after 24 hours
- [ ] Takeover button disabled for own chores
- [ ] Successful takeover updates assignee and shows confirmation
- [ ] Bonus points/XP calculated and displayed correctly
- [ ] Daily takeover limit (2) enforced
- [ ] Admin approval modal for high-value chores

### Offline Support
- [ ] Takeover requests queue when offline
- [ ] Conflict resolution when multiple users attempt takeover
- [ ] Sync validates takeover eligibility on reconnection

### UI/UX
- [ ] Clear visual indicator for takeover-eligible chores
- [ ] Takeover history viewable in chore details
- [ ] "Most Helpful" section in leaderboard
- [ ] Achievement progress for Helper Hero badge
- [ ] Toast notifications for takeover events

### Data Integrity
- [ ] Original assignee stats updated (failed completion)
- [ ] New assignee stats updated (takeover count, bonus)
- [ ] Chore history preserves takeover trail
- [ ] Firestore security rules prevent unauthorized takeovers

### Edge Cases
- [ ] Cannot takeover locked chores
- [ ] Recurring chore takeover only affects current instance
- [ ] Deleted user's chores become immediately takeover-eligible
- [ ] Family admin can force-assign without takeover mechanics

### Performance
- [ ] Takeover eligibility calculated efficiently
- [ ] No performance degradation with many overdue chores
- [ ] Batch operations for bulk takeovers
- [ ] Optimistic UI updates with rollback on failure

### Testing
- [ ] Unit tests cover all takeover scenarios
- [ ] Integration tests verify Firestore operations
- [ ] E2E tests confirm user flow
- [ ] Manual testing on iOS, Android, and Web