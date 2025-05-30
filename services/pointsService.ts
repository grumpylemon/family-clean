import { auth, safeCollection } from '../config/firebase';
import { 
  PointTransaction, 
  PointMilestone, 
  PointTransferRequest,
  User,
  FamilyMember,
  Family
} from '../types';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { Platform } from 'react-native';

// Point Milestones Configuration
const POINT_MILESTONES: PointMilestone[] = [
  {
    id: 'milestone_1k',
    level: 1,
    pointsRequired: 1000,
    title: 'Point Collector',
    description: 'Earn your first 1,000 points',
    icon: '🎯',
    xpReward: 100,
    unlockRewards: {
      bonusPoints: 50,
      specialBadge: 'collector'
    }
  },
  {
    id: 'milestone_5k',
    level: 2,
    pointsRequired: 5000,
    title: 'Point Enthusiast',
    description: 'Reach 5,000 lifetime points',
    icon: '⭐',
    xpReward: 250,
    unlockRewards: {
      bonusPoints: 100,
      specialBadge: 'enthusiast'
    }
  },
  {
    id: 'milestone_10k',
    level: 3,
    pointsRequired: 10000,
    title: 'Point Master',
    description: 'Achieve 10,000 lifetime points',
    icon: '💎',
    xpReward: 500,
    unlockRewards: {
      bonusPoints: 200,
      specialBadge: 'master',
      unlockFeature: 'premium_rewards'
    }
  },
  {
    id: 'milestone_25k',
    level: 4,
    pointsRequired: 25000,
    title: 'Point Champion',
    description: 'Reach the milestone of 25,000 points',
    icon: '🏆',
    xpReward: 750,
    unlockRewards: {
      bonusPoints: 500,
      specialBadge: 'champion'
    }
  },
  {
    id: 'milestone_50k',
    level: 5,
    pointsRequired: 50000,
    title: 'Point Legend',
    description: 'Become a legend with 50,000 points',
    icon: '👑',
    xpReward: 1000,
    unlockRewards: {
      bonusPoints: 1000,
      specialBadge: 'legend',
      unlockFeature: 'exclusive_rewards'
    }
  },
  {
    id: 'milestone_100k',
    level: 6,
    pointsRequired: 100000,
    title: 'Point Emperor',
    description: 'Rule with 100,000 lifetime points',
    icon: '🌟',
    xpReward: 2000,
    unlockRewards: {
      bonusPoints: 2000,
      specialBadge: 'emperor',
      unlockFeature: 'custom_rewards'
    }
  }
];

// Advanced Point Calculation Factors
export interface PointCalculationFactors {
  basePoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeOfDay?: Date;
  weatherCondition?: 'sunny' | 'rainy' | 'cold' | 'hot';
  userAge?: number;
  completionQuality?: number; // 1-5 rating
  isEarlyCompletion?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
  familyBoostActive?: boolean;
}

/**
 * Calculate advanced points with dynamic algorithms
 */
export const calculateAdvancedPoints = (factors: PointCalculationFactors): number => {
  let points = factors.basePoints;
  
  // Difficulty multiplier
  const difficultyMultipliers = { easy: 1.0, medium: 1.2, hard: 1.5 };
  points *= difficultyMultipliers[factors.difficulty];
  
  // Time of day bonus
  if (factors.timeOfDay) {
    const hour = factors.timeOfDay.getHours();
    if (hour >= 6 && hour <= 8) {
      points *= 1.2; // Early bird bonus
    } else if (hour >= 20) {
      points *= 1.1; // Night owl bonus
    }
  }
  
  // Quality rating bonus
  if (factors.completionQuality && factors.completionQuality > 3) {
    points *= 1 + (factors.completionQuality - 3) * 0.1; // Up to 20% bonus for perfect quality
  }
  
  // Early completion bonus
  if (factors.isEarlyCompletion) {
    points *= 1.15;
  }
  
  // Weekend bonus
  if (factors.isWeekend) {
    points *= 1.1;
  }
  
  // Weather condition adjustments for outdoor chores
  if (factors.weatherCondition && (factors.weatherCondition === 'rainy' || factors.weatherCondition === 'cold')) {
    points *= 1.25; // Bonus for doing outdoor chores in difficult weather
  }
  
  // Age-based adjustments
  if (factors.userAge) {
    if (factors.userAge < 10) {
      points *= 1.3; // Encourage younger kids
    } else if (factors.userAge > 16) {
      points *= 0.9; // Slight reduction for adults
    }
  }
  
  // Family boost event
  if (factors.familyBoostActive) {
    points *= 2.0; // Double points event
  }
  
  return Math.round(points);
};

/**
 * Log a point transaction
 */
export const logPointTransaction = async (transaction: Omit<PointTransaction, 'id' | 'createdAt'>): Promise<string | null> => {
  // Mock implementation for iOS
  if (Platform.OS === 'ios') {
    console.log('Mock log point transaction:', transaction);
    return `mock-transaction-${Date.now()}`;
  }
  
  try {
    const db = getFirestore();
    if (!db) return null;
    
    const transactionData = {
      ...transaction,
      createdAt: new Date().toISOString()
    };
    
    const transactionsRef = collection(db, 'pointTransactions');
    const docRef = await addDoc(transactionsRef, transactionData);
    
    console.log(`Point transaction logged: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging point transaction:', error);
    return null;
  }
};

/**
 * Get point transaction history for a user
 */
export const getPointTransactionHistory = async (
  userId: string, 
  familyId: string, 
  limitCount: number = 50
): Promise<PointTransaction[]> => {
  // Mock implementation for iOS
  if (Platform.OS === 'ios') {
    return generateMockTransactionHistory(userId, limitCount);
  }
  
  try {
    const db = getFirestore();
    if (!db) return [];
    
    const transactionsRef = collection(db, 'pointTransactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PointTransaction[];
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
};

/**
 * Check for point milestones and award them
 */
export const checkPointMilestones = async (
  userId: string,
  currentLifetimePoints: number,
  previousLifetimePoints: number
): Promise<PointMilestone[]> => {
  const newMilestones: PointMilestone[] = [];
  
  for (const milestone of POINT_MILESTONES) {
    // Check if user just crossed this milestone
    if (currentLifetimePoints >= milestone.pointsRequired && 
        previousLifetimePoints < milestone.pointsRequired) {
      newMilestones.push(milestone);
      
      // Log the milestone achievement
      await logPointTransaction({
        userId,
        familyId: 'current', // This should be passed from the calling function
        type: 'milestone',
        amount: milestone.unlockRewards?.bonusPoints || 0,
        source: 'milestone',
        sourceId: milestone.id,
        description: `Milestone achieved: ${milestone.title}`,
        metadata: {
          milestoneLevel: milestone.level
        }
      });
    }
  }
  
  return newMilestones;
};

/**
 * Create a point transfer request
 */
export const createPointTransferRequest = async (
  fromUserId: string,
  toUserId: string,
  amount: number,
  reason: string,
  familyId: string
): Promise<{ success: boolean; requestId?: string; error?: string }> => {
  // Mock implementation for iOS
  if (Platform.OS === 'ios') {
    console.log('Mock create point transfer request');
    return { success: true, requestId: `mock-request-${Date.now()}` };
  }
  
  try {
    // Check if family allows point transfers
    // This would typically check family settings
    
    // Check if sender has enough points
    // This would typically check user's current points
    
    const db = getFirestore();
    if (!db) return { success: false, error: 'Database not available' };
    
    const transferRequest: Omit<PointTransferRequest, 'id'> = {
      fromUserId,
      fromUserName: 'User', // This should be fetched from user profile
      toUserId,
      toUserName: 'User', // This should be fetched from user profile
      amount,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      familyId
    };
    
    const requestsRef = collection(db, 'pointTransferRequests');
    const docRef = await addDoc(requestsRef, transferRequest);
    
    return { success: true, requestId: docRef.id };
  } catch (error) {
    console.error('Error creating point transfer request:', error);
    return { success: false, error: 'Failed to create transfer request' };
  }
};

/**
 * Process a point transfer (admin approval)
 */
export const processPointTransfer = async (
  requestId: string,
  adminId: string,
  approved: boolean,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> => {
  // Mock implementation for iOS
  if (Platform.OS === 'ios') {
    console.log('Mock process point transfer');
    return { success: true };
  }
  
  try {
    const db = getFirestore();
    if (!db) return { success: false, error: 'Database not available' };
    
    // Update the transfer request status
    const requestRef = doc(db, 'pointTransferRequests', requestId);
    await setDoc(requestRef, {
      status: approved ? 'approved' : 'declined',
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || ''
    }, { merge: true });
    
    if (approved) {
      // Process the actual point transfer
      // This would involve updating both users' point balances
      // and logging the transactions
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing point transfer:', error);
    return { success: false, error: 'Failed to process transfer' };
  }
};

/**
 * Get point statistics for a user
 */
export const getPointStatistics = async (userId: string, familyId: string): Promise<{
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  lifetimePoints: number;
  weeklyPoints: number;
  averageDaily: number;
  biggestSingleEarn: number;
  currentMilestone?: PointMilestone;
  nextMilestone?: PointMilestone;
  milestonesAchieved: number;
}> => {
  // Mock implementation for iOS
  if (Platform.OS === 'ios') {
    return {
      totalEarned: 1250,
      totalSpent: 200,
      currentBalance: 1050,
      lifetimePoints: 1250,
      weeklyPoints: 180,
      averageDaily: 25,
      biggestSingleEarn: 100,
      currentMilestone: POINT_MILESTONES[0],
      nextMilestone: POINT_MILESTONES[1],
      milestonesAchieved: 1
    };
  }
  
  try {
    const transactions = await getPointTransactionHistory(userId, familyId, 1000);
    
    const totalEarned = transactions
      .filter(t => t.type === 'earned' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'spent')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const biggestSingleEarn = Math.max(
      ...transactions
        .filter(t => t.type === 'earned' || t.type === 'bonus')
        .map(t => t.amount),
      0
    );
    
    // Calculate milestones
    const lifetimePoints = totalEarned;
    const achievedMilestones = POINT_MILESTONES.filter(m => m.pointsRequired <= lifetimePoints);
    const nextMilestone = POINT_MILESTONES.find(m => m.pointsRequired > lifetimePoints);
    
    return {
      totalEarned,
      totalSpent,
      currentBalance: totalEarned - totalSpent,
      lifetimePoints,
      weeklyPoints: 180, // This would be calculated from recent transactions
      averageDaily: totalEarned / Math.max(1, transactions.length),
      biggestSingleEarn,
      currentMilestone: achievedMilestones[achievedMilestones.length - 1],
      nextMilestone,
      milestonesAchieved: achievedMilestones.length
    };
  } catch (error) {
    console.error('Error getting point statistics:', error);
    return {
      totalEarned: 0,
      totalSpent: 0,
      currentBalance: 0,
      lifetimePoints: 0,
      weeklyPoints: 0,
      averageDaily: 0,
      biggestSingleEarn: 0,
      milestonesAchieved: 0
    };
  }
};

/**
 * Generate mock transaction history for development
 */
const generateMockTransactionHistory = (userId: string, count: number): PointTransaction[] => {
  const transactions: PointTransaction[] = [];
  const sources = ['chore', 'achievement', 'streak', 'milestone'] as const;
  const types = ['earned', 'spent', 'bonus'] as const;
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    transactions.push({
      id: `mock-${i}`,
      userId,
      familyId: 'mock-family',
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 100) + 10,
      source: sources[Math.floor(Math.random() * sources.length)],
      description: `Mock transaction ${i + 1}`,
      createdAt: createdAt.toISOString()
    });
  }
  
  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Get all point milestones
 */
export const getAllPointMilestones = (): PointMilestone[] => {
  return POINT_MILESTONES;
};

/**
 * Calculate point decay prevention score
 */
export const calculatePointDecayPrevention = (lastActivityDate: Date): number => {
  const daysSinceActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceActivity < 7) return 1.0; // No decay
  if (daysSinceActivity < 14) return 0.95; // 5% decay warning
  if (daysSinceActivity < 30) return 0.9; // 10% decay
  if (daysSinceActivity < 60) return 0.8; // 20% decay
  return 0.7; // Maximum 30% decay
};

/**
 * Calculate team completion bonus
 */
export const calculateTeamCompletionBonus = (
  familyCompletionRate: number,
  individualPoints: number
): number => {
  if (familyCompletionRate >= 0.9) return Math.round(individualPoints * 0.5); // 50% bonus
  if (familyCompletionRate >= 0.75) return Math.round(individualPoints * 0.25); // 25% bonus
  if (familyCompletionRate >= 0.5) return Math.round(individualPoints * 0.1); // 10% bonus
  return 0;
};

/**
 * Handle point penalties for overdue chores
 */
export const applyOverduePenalty = async (
  userId: string,
  choreId: string,
  choreTitle: string,
  daysOverdue: number,
  familyId: string
): Promise<number> => {
  let penalty = 0;
  
  if (daysOverdue >= 1) penalty = Math.min(daysOverdue * 5, 50); // Max 50 point penalty
  
  if (penalty > 0) {
    await logPointTransaction({
      userId,
      familyId,
      type: 'penalty',
      amount: -penalty,
      source: 'chore',
      sourceId: choreId,
      description: `Penalty for overdue chore: ${choreTitle}`,
      metadata: {
        choreTitle,
        adminNote: `${daysOverdue} days overdue`
      }
    });
  }
  
  return penalty;
};