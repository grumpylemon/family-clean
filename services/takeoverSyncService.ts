// Takeover Sync Service - Handles synchronization of chore takeover actions
// Processes offline takeover queue and updates analytics

import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { 
  getChoresCollection, 
  getFamiliesCollection,
  db,
} from '@/config/firebase';
import { OfflineAction } from '@/stores/types';
import { Chore, ChoreTakeover, FamilyMember } from '@/types';
import { checkAchievementProgress } from './gamification';

export interface TakeoverSyncResult {
  success: boolean;
  choreId: string;
  message: string;
  bonusAwarded?: {
    points: number;
    xp: number;
  };
  achievementUnlocked?: string;
}

// Process a takeover action from the offline queue
export async function processTakeoverAction(
  action: OfflineAction
): Promise<TakeoverSyncResult> {
  const { 
    choreId, 
    originalAssigneeId, 
    reason, 
    bonusPoints, 
    bonusXP, 
    requiresAdminApproval 
  } = action.payload;
  
  const takingOverUserId = action.userId;
  const familyId = action.familyId;
  
  if (!familyId) {
    return {
      success: false,
      choreId,
      message: 'Family ID is required for takeover',
    };
  }
  
  try {
    // Use a transaction to ensure atomic updates
    const result = await runTransaction(db, async (transaction) => {
      // Get current chore state
      const choreRef = doc(getChoresCollection()!, choreId);
      const choreDoc = await transaction.get(choreRef);
      
      if (!choreDoc.exists()) {
        throw new Error('Chore not found');
      }
      
      const chore = { id: choreDoc.id, ...choreDoc.data() } as Chore;
      
      // Validate takeover is still valid
      if (chore.status === 'completed') {
        throw new Error('Chore already completed');
      }
      
      if (chore.assignedTo === takingOverUserId) {
        throw new Error('Already assigned to you');
      }
      
      if (chore.isTakenOver && chore.takenOverBy !== takingOverUserId) {
        throw new Error('Already taken over by another member');
      }
      
      // Get family data for member info and settings
      const familyRef = doc(getFamiliesCollection()!, familyId);
      const familyDoc = await transaction.get(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }
      
      const family = familyDoc.data();
      const takingOverMember = family.members.find(
        (m: FamilyMember) => m.uid === takingOverUserId
      );
      
      if (!takingOverMember) {
        throw new Error('User not a family member');
      }
      
      // Check if admin approval is still required
      if (requiresAdminApproval && !action.payload.adminApproved) {
        // TODO: Queue for admin approval
        throw new Error('Admin approval required for high-value chore');
      }
      
      // Calculate overdue hours
      const dueDate = new Date(chore.dueDate);
      const overdueHours = Math.max(0, (Date.now() - dueDate.getTime()) / (1000 * 60 * 60));
      
      // Update chore with takeover information
      const choreUpdate: Partial<Chore> = {
        originalAssignee: chore.originalAssignee || chore.assignedTo,
        originalAssigneeName: chore.originalAssigneeName || chore.assignedToName,
        assignedTo: takingOverUserId,
        assignedToName: takingOverMember.name,
        takenOverBy: takingOverUserId,
        takenOverByName: takingOverMember.name,
        takenOverAt: new Date().toISOString(),
        takeoverReason: reason,
        isTakenOver: true,
        takeoverBonusPoints: bonusPoints,
        takeoverBonusXP: bonusXP,
        missedBy: chore.missedBy 
          ? (chore.missedBy.includes(chore.assignedTo) 
              ? chore.missedBy 
              : [...chore.missedBy, chore.assignedTo])
          : [chore.assignedTo],
      };
      
      // Update takeover history
      if (!chore.takeoverHistory) {
        choreUpdate.takeoverHistory = [];
      }
      
      choreUpdate.takeoverHistory = [
        ...(chore.takeoverHistory || []),
        {
          originalAssignee: chore.assignedTo,
          originalAssigneeName: chore.assignedToName || 'Unknown',
          takenOverBy: takingOverUserId,
          takenOverByName: takingOverMember.name,
          takenOverAt: new Date().toISOString(),
          bonusPoints,
          bonusXP,
          reason,
          adminApproved: action.payload.adminApproved || false,
        },
      ];
      
      transaction.update(choreRef, choreUpdate);
      
      // Update member takeover stats
      const updatedMembers = family.members.map((member: FamilyMember) => {
        if (member.uid === takingOverUserId) {
          const stats = member.takeoverStats || {
            choresTakenOver: 0,
            totalTakeoverBonus: 0,
            takeoverStreak: 0,
            dailyTakeoverCount: 0,
            dailyTakeoverResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          };
          
          // Check if daily reset is needed
          if (new Date() > new Date(stats.dailyTakeoverResetAt)) {
            stats.dailyTakeoverCount = 0;
            stats.dailyTakeoverResetAt = new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString();
          }
          
          return {
            ...member,
            takeoverStats: {
              ...stats,
              choresTakenOver: stats.choresTakenOver + 1,
              totalTakeoverBonus: stats.totalTakeoverBonus + bonusPoints,
              lastTakeoverAt: new Date().toISOString(),
              dailyTakeoverCount: stats.dailyTakeoverCount + 1,
              // Update streak if last takeover was yesterday
              takeoverStreak: isConsecutiveDay(stats.lastTakeoverAt)
                ? stats.takeoverStreak + 1
                : 1,
            },
          };
        }
        return member;
      });
      
      transaction.update(familyRef, { members: updatedMembers });
      
      // Create takeover record for analytics
      const takeoverRecord: Omit<ChoreTakeover, 'id'> = {
        choreId,
        choreTitle: chore.title,
        originalAssigneeId: chore.assignedTo,
        originalAssigneeName: chore.assignedToName || 'Unknown',
        newAssigneeId: takingOverUserId,
        newAssigneeName: takingOverMember.name,
        familyId,
        takenOverAt: new Date().toISOString(),
        reason: reason || 'overdue',
        bonusPoints,
        bonusXP,
        adminApproved: action.payload.adminApproved || false,
        requiresAdminApproval,
        overdueHours,
      };
      
      // Add to takeovers collection
      await addDoc(collection(db, 'takeovers'), {
        ...takeoverRecord,
        createdAt: serverTimestamp(),
      });
      
      return { 
        chore, 
        updatedMember: updatedMembers.find((m: FamilyMember) => m.uid === takingOverUserId),
        overdueHours,
      };
    });
    
    // Check for achievement progress
    const helperHeroProgress = await checkAchievementProgress(
      takingOverUserId,
      'helper_hero',
      result.updatedMember.takeoverStats.choresTakenOver
    );
    
    return {
      success: true,
      choreId,
      message: 'Chore takeover successful',
      bonusAwarded: {
        points: bonusPoints,
        xp: bonusXP,
      },
      achievementUnlocked: helperHeroProgress?.unlocked ? 'helper_hero' : undefined,
    };
    
  } catch (error) {
    console.error('Takeover sync error:', error);
    return {
      success: false,
      choreId,
      message: error instanceof Error ? error.message : 'Failed to process takeover',
    };
  }
}

// Check if the last takeover was on the previous day (for streak calculation)
function isConsecutiveDay(lastTakeoverAt?: string): boolean {
  if (!lastTakeoverAt) return false;
  
  const lastDate = new Date(lastTakeoverAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    lastDate.getFullYear() === yesterday.getFullYear() &&
    lastDate.getMonth() === yesterday.getMonth() &&
    lastDate.getDate() === yesterday.getDate()
  );
}

// Get takeover analytics for a family
export async function getTakeoverAnalytics(
  familyId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'
): Promise<any> {
  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all-time':
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Query takeovers for the period
    const takeoversQuery = query(
      collection(db, 'takeovers'),
      where('familyId', '==', familyId),
      where('takenOverAt', '>=', startDate.toISOString())
    );
    
    const takeoversSnapshot = await getDocs(takeoversQuery);
    const takeovers = takeoversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChoreTakeover[];
    
    // Calculate analytics
    const analytics = {
      period,
      totalTakeovers: takeovers.length,
      uniqueHelpers: new Set(takeovers.map(t => t.newAssigneeId)).size,
      totalBonusPoints: takeovers.reduce((sum, t) => sum + t.bonusPoints, 0),
      averageResponseTime: calculateAverageResponseTime(takeovers),
      takeoversByUser: calculateTakeoversByUser(takeovers),
      choreHealthMetrics: await calculateChoreHealthMetrics(familyId, takeovers),
    };
    
    return analytics;
    
  } catch (error) {
    console.error('Error calculating takeover analytics:', error);
    throw error;
  }
}

function calculateAverageResponseTime(takeovers: ChoreTakeover[]): number {
  if (takeovers.length === 0) return 0;
  
  const totalHours = takeovers.reduce((sum, t) => sum + (t.overdueHours || 0), 0);
  return totalHours / takeovers.length;
}

function calculateTakeoversByUser(takeovers: ChoreTakeover[]): Record<string, any> {
  const byUser: Record<string, any> = {};
  
  takeovers.forEach(takeover => {
    const userId = takeover.newAssigneeId;
    if (!byUser[userId]) {
      byUser[userId] = {
        userId,
        userName: takeover.newAssigneeName,
        count: 0,
        bonusPoints: 0,
        totalOverdueHours: 0,
      };
    }
    
    byUser[userId].count++;
    byUser[userId].bonusPoints += takeover.bonusPoints;
    byUser[userId].totalOverdueHours += takeover.overdueHours || 0;
  });
  
  // Calculate averages
  Object.values(byUser).forEach(user => {
    user.averageResponseTime = user.count > 0 
      ? user.totalOverdueHours / user.count 
      : 0;
  });
  
  return byUser;
}

async function calculateChoreHealthMetrics(
  familyId: string, 
  takeovers: ChoreTakeover[]
): Promise<any[]> {
  // Get all chores for the family
  const choresQuery = query(
    getChoresCollection()!,
    where('familyId', '==', familyId)
  );
  
  const choresSnapshot = await getDocs(choresQuery);
  const totalChores = choresSnapshot.size;
  
  // Group takeovers by chore
  const takeoversByChore: Record<string, ChoreTakeover[]> = {};
  takeovers.forEach(takeover => {
    if (!takeoversByChore[takeover.choreId]) {
      takeoversByChore[takeover.choreId] = [];
    }
    takeoversByChore[takeover.choreId].push(takeover);
  });
  
  // Calculate metrics for each chore with takeovers
  const metrics = Object.entries(takeoversByChore).map(([choreId, choreTakeovers]) => {
    const choreDoc = choresSnapshot.docs.find(doc => doc.id === choreId);
    const choreData = choreDoc?.data() as Chore | undefined;
    
    return {
      choreId,
      choreTitle: choreData?.title || 'Unknown Chore',
      choreType: choreData?.type,
      takeoverCount: choreTakeovers.length,
      takeoverRate: totalChores > 0 ? choreTakeovers.length / totalChores : 0,
      averageOverdueHours: calculateAverageResponseTime(choreTakeovers),
      mostFrequentHelper: getMostFrequentHelper(choreTakeovers),
    };
  });
  
  return metrics.sort((a, b) => b.takeoverCount - a.takeoverCount);
}

function getMostFrequentHelper(takeovers: ChoreTakeover[]): any {
  const helperCounts: Record<string, number> = {};
  
  takeovers.forEach(takeover => {
    helperCounts[takeover.newAssigneeId] = 
      (helperCounts[takeover.newAssigneeId] || 0) + 1;
  });
  
  const entries = Object.entries(helperCounts);
  if (entries.length === 0) return null;
  
  const [helperId, count] = entries.reduce((max, curr) => 
    curr[1] > max[1] ? curr : max
  );
  
  const helper = takeovers.find(t => t.newAssigneeId === helperId);
  
  return {
    userId: helperId,
    userName: helper?.newAssigneeName || 'Unknown',
    count,
  };
}