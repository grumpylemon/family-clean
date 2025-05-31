import { auth, safeCollection } from '../config/firebase';
import {
  AdvancedChoreCard,
  InstructionSet,
  ChoreCompletionHistory,
  UserChorePreference,
  PerformanceMetrics,
  UserCertificationStatus,
  ChoreCardAnalytics,
  AgeGroup,
  QualityRating,
  CertificationLevel
} from '../types';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Version identifier for service
console.log("ChoreCardService version: v1.0");

// Collection references
const getAdvancedCardsCollection = () => safeCollection('advancedChoreCards');
const getCompletionHistoryCollection = () => safeCollection('choreCompletionHistory');
const getUserPreferencesCollection = () => safeCollection('userChorePreferences');
const getPerformanceMetricsCollection = () => safeCollection('performanceMetrics');
const getCertificationStatusCollection = () => safeCollection('certificationStatus');

/**
 * Advanced Chore Card Service
 * Manages comprehensive chore card functionality including instructions,
 * certification, performance tracking, and educational content
 */
class ChoreCardService {

  // ============ ADVANCED CARD MANAGEMENT ============

  /**
   * Create or update an advanced chore card
   */
  async createAdvancedCard(cardData: Omit<AdvancedChoreCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const newCard: Omit<AdvancedChoreCard, 'id'> = {
        ...cardData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        version: 1
      };

      const docRef = await addDoc(getAdvancedCardsCollection(), newCard);
      console.log('Advanced chore card created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating advanced chore card:', error);
      throw error;
    }
  }

  /**
   * Get advanced card by chore ID
   */
  async getAdvancedCard(choreId: string): Promise<AdvancedChoreCard | null> {
    try {
      const q = query(
        getAdvancedCardsCollection(),
        where('choreId', '==', choreId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data() as any;
      return { id: doc.id, ...data } as AdvancedChoreCard;
    } catch (error) {
      console.error('Error fetching advanced card:', error);
      return null;
    }
  }

  /**
   * Update advanced card
   */
  async updateAdvancedCard(cardId: string, updates: Partial<AdvancedChoreCard>): Promise<void> {
    try {
      const cardRef = doc(getAdvancedCardsCollection(), cardId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        version: (updates.version || 1) + 1
      };

      await updateDoc(cardRef, updateData);
      console.log('Advanced card updated:', cardId);
    } catch (error) {
      console.error('Error updating advanced card:', error);
      throw error;
    }
  }

  // ============ INSTRUCTION SYSTEM ============

  /**
   * Get age-appropriate instructions for a chore
   */
  getInstructionsForUser(card: AdvancedChoreCard, userAge?: number): InstructionSet | null {
    if (!card.instructions) return null;

    // Determine age group based on user age
    let ageGroup: AgeGroup = 'adult';
    if (userAge) {
      if (userAge <= 8) ageGroup = 'child';
      else if (userAge <= 12) ageGroup = 'teen';
    }

    // Return instructions for age group, fallback to next level up
    return card.instructions[ageGroup] || 
           card.instructions.adult || 
           card.instructions.teen || 
           card.instructions.child || 
           null;
  }

  /**
   * Track instruction engagement
   */
  async trackInstructionUsage(choreId: string, userId: string, stepId?: string): Promise<void> {
    try {
      // This could be expanded to track which steps users view most
      console.log(`User ${userId} viewed instructions for chore ${choreId}`, stepId ? `step ${stepId}` : '');
      
      // In a full implementation, this would update analytics
      // For now, just log the engagement
    } catch (error) {
      console.error('Error tracking instruction usage:', error);
    }
  }

  // ============ COMPLETION TRACKING ============

  /**
   * Record chore completion with advanced details
   */
  async recordCompletion(completionData: Omit<ChoreCompletionHistory, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(getCompletionHistoryCollection(), {
        ...completionData,
        completedAt: new Date().toISOString()
      });

      // Update performance metrics
      const completionWithId = { ...completionData, id: docRef.id };
      await this.updatePerformanceMetrics(completionData.userId, completionData.choreId, completionWithId);

      console.log('Completion recorded:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error recording completion:', error);
      throw error;
    }
  }

  /**
   * Get completion history for a user and chore
   */
  async getCompletionHistory(userId: string, choreId: string, limitCount: number = 10): Promise<ChoreCompletionHistory[]> {
    try {
      const q = query(
        getCompletionHistoryCollection(),
        where('userId', '==', userId),
        where('choreId', '==', choreId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as ChoreCompletionHistory;
      });
    } catch (error) {
      console.error('Error fetching completion history:', error);
      return [];
    }
  }

  // ============ PREFERENCE TRACKING ============

  /**
   * Update user satisfaction rating for a chore
   */
  async updateChorePreference(userId: string, choreId: string, rating: number, notes?: string): Promise<void> {
    try {
      const preferenceId = `${userId}_${choreId}`;
      const preferenceRef = doc(getUserPreferencesCollection(), preferenceId);

      const preferenceData: UserChorePreference = {
        userId,
        choreId,
        satisfactionRating: rating,
        preferenceNotes: notes,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(preferenceRef, preferenceData, { merge: true });
      console.log('Chore preference updated:', preferenceId);
    } catch (error) {
      console.error('Error updating chore preference:', error);
      throw error;
    }
  }

  /**
   * Get user's preference for a chore
   */
  async getChorePreference(userId: string, choreId: string): Promise<UserChorePreference | null> {
    try {
      const preferenceId = `${userId}_${choreId}`;
      const preferenceRef = doc(getUserPreferencesCollection(), preferenceId);
      const preferenceDoc = await getDoc(preferenceRef);

      if (!preferenceDoc.exists()) return null;

      const data = preferenceDoc.data() as any;
      return { ...data } as UserChorePreference;
    } catch (error) {
      console.error('Error fetching chore preference:', error);
      return null;
    }
  }

  // ============ PERFORMANCE METRICS ============

  /**
   * Update performance metrics after completion
   */
  private async updatePerformanceMetrics(userId: string, choreId: string, completion: ChoreCompletionHistory): Promise<void> {
    try {
      const metricsId = `${userId}_${choreId}`;
      const metricsRef = doc(getPerformanceMetricsCollection(), metricsId);
      const existingDoc = await getDoc(metricsRef);

      let metrics: PerformanceMetrics;

      if (existingDoc.exists()) {
        const existing = existingDoc.data() as any as PerformanceMetrics;
        
        // Calculate new averages
        const newTotalCompletions = existing.totalCompletions + 1;
        const qualityValue = this.getQualityValue(completion.qualityRating);
        
        metrics = {
          ...existing,
          totalCompletions: newTotalCompletions,
          averageQualityRating: (existing.averageQualityRating * existing.totalCompletions + qualityValue) / newTotalCompletions,
          averageSatisfactionRating: (existing.averageSatisfactionRating * existing.totalCompletions + completion.satisfactionRating) / newTotalCompletions,
          averageCompletionTime: (existing.averageCompletionTime * existing.totalCompletions + completion.timeToComplete) / newTotalCompletions,
          excellentCount: existing.excellentCount + (completion.qualityRating === 'excellent' ? 1 : 0),
          incompleteCount: existing.incompleteCount + (completion.qualityRating === 'incomplete' ? 1 : 0),
          lastCompletedAt: completion.completedAt,
          personalBestTime: Math.min(existing.personalBestTime || completion.timeToComplete, completion.timeToComplete),
          qualityStreak: completion.qualityRating === 'excellent' ? existing.qualityStreak + 1 : 0
        };
      } else {
        // First completion
        metrics = {
          userId,
          choreId,
          totalCompletions: 1,
          averageQualityRating: this.getQualityValue(completion.qualityRating),
          averageSatisfactionRating: completion.satisfactionRating,
          averageCompletionTime: completion.timeToComplete,
          excellentCount: completion.qualityRating === 'excellent' ? 1 : 0,
          incompleteCount: completion.qualityRating === 'incomplete' ? 1 : 0,
          improvementTrend: 'stable',
          lastCompletedAt: completion.completedAt,
          personalBestTime: completion.timeToComplete,
          qualityStreak: completion.qualityRating === 'excellent' ? 1 : 0
        };
      }

      await setDoc(metricsRef, metrics);
      console.log('Performance metrics updated:', metricsId);
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  /**
   * Get performance metrics for a user and chore
   */
  async getPerformanceMetrics(userId: string, choreId: string): Promise<PerformanceMetrics | null> {
    try {
      const metricsId = `${userId}_${choreId}`;
      const metricsRef = doc(getPerformanceMetricsCollection(), metricsId);
      const metricsDoc = await getDoc(metricsRef);

      if (!metricsDoc.exists()) return null;

      const data = metricsDoc.data() as any;
      return { ...data } as PerformanceMetrics;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return null;
    }
  }

  /**
   * Convert quality rating to numeric value
   */
  private getQualityValue(rating: QualityRating): number {
    switch (rating) {
      case 'incomplete': return 0;
      case 'partial': return 0.5;
      case 'complete': return 1.0;
      case 'excellent': return 1.2;
      default: return 0.8;
    }
  }

  // ============ CERTIFICATION SYSTEM ============

  /**
   * Check if user is certified for a chore
   */
  async getCertificationStatus(userId: string, choreId: string): Promise<UserCertificationStatus | null> {
    try {
      const statusId = `${userId}_${choreId}`;
      const statusRef = doc(getCertificationStatusCollection(), statusId);
      const statusDoc = await getDoc(statusRef);

      if (!statusDoc.exists()) return null;

      const data = statusDoc.data() as any;
      return { ...data } as UserCertificationStatus;
    } catch (error) {
      console.error('Error fetching certification status:', error);
      return null;
    }
  }

  /**
   * Update certification status
   */
  async updateCertificationStatus(status: UserCertificationStatus): Promise<void> {
    try {
      const statusId = `${status.userId}_${status.choreId}`;
      const statusRef = doc(getCertificationStatusCollection(), statusId);

      await setDoc(statusRef, status, { merge: true });
      console.log('Certification status updated:', statusId);
    } catch (error) {
      console.error('Error updating certification status:', error);
      throw error;
    }
  }

  // ============ SMART ASSIGNMENT ============

  /**
   * Calculate assignment score based on user preferences and performance
   */
  async calculateAssignmentScore(userId: string, choreId: string): Promise<number> {
    try {
      const preference = await this.getChorePreference(userId, choreId);
      const metrics = await this.getPerformanceMetrics(userId, choreId);
      const certification = await this.getCertificationStatus(userId, choreId);

      let score = 50; // Base score

      // Factor in satisfaction rating (40% weight)
      if (preference) {
        score += (preference.satisfactionRating - 3) * 10; // -20 to +20
      }

      // Factor in performance (30% weight)
      if (metrics) {
        score += (metrics.averageQualityRating - 0.8) * 50; // Performance bonus
        score += Math.min(10, metrics.qualityStreak); // Streak bonus
      }

      // Factor in certification (20% weight)
      if (certification && certification.status === 'certified') {
        score += 15;
      } else if (certification && certification.status === 'probation') {
        score -= 25;
      }

      // Factor in recent completion (10% weight)
      if (metrics?.lastCompletedAt) {
        const daysSinceLastCompletion = (Date.now() - new Date(metrics.lastCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastCompletion < 7) {
          score -= 10; // Recent completion penalty
        }
      }

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.error('Error calculating assignment score:', error);
      return 50; // Default score
    }
  }

  // ============ ANALYTICS ============

  /**
   * Generate analytics for a chore card
   */
  async generateChoreCardAnalytics(choreId: string, familyId: string, days: number = 30): Promise<ChoreCardAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      // Get all completions in period
      const q = query(
        getCompletionHistoryCollection(),
        where('choreId', '==', choreId),
        where('completedAt', '>=', startDate.toISOString()),
        where('completedAt', '<=', endDate.toISOString())
      );

      const snapshot = await getDocs(q);
      const completions = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return data as ChoreCompletionHistory;
      });

      // Calculate metrics
      const totalCompletions = completions.length;
      const averageQualityRating = totalCompletions > 0 
        ? completions.reduce((sum, c) => sum + this.getQualityValue(c.qualityRating), 0) / totalCompletions 
        : 0;
      const averageSatisfactionRating = totalCompletions > 0
        ? completions.reduce((sum, c) => sum + c.satisfactionRating, 0) / totalCompletions
        : 0;

      // Calculate engagement metrics
      const instructionEngagement = totalCompletions > 0
        ? (completions.filter(c => c.instructionRating && c.instructionRating > 0).length / totalCompletions) * 100
        : 0;

      const analytics: ChoreCardAnalytics = {
        choreId,
        familyId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        metrics: {
          totalCompletions,
          averageQualityRating,
          averageSatisfactionRating,
          instructionEngagement,
          certificationProgress: 0, // Would need to calculate from certification data
          educationalEngagement: 0, // Would need to track fact/quote views
          improvementRate: 0 // Would need historical comparison
        },
        topPerformers: {
          quality: [],
          satisfaction: [],
          speed: []
        },
        insights: {
          needsAttention: [],
          excelling: [],
          suggestions: []
        },
        lastUpdated: new Date().toISOString()
      };

      return analytics;
    } catch (error) {
      console.error('Error generating chore card analytics:', error);
      throw error;
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check if advanced cards are enabled for family
   */
  async isAdvancedCardsEnabled(familyId: string): Promise<boolean> {
    // In a full implementation, this would check family settings
    // For now, return true to enable for all families
    return true;
  }

  /**
   * Get recommended next assignee based on smart assignment
   */
  async getRecommendedAssignee(choreId: string, availableUserIds: string[]): Promise<string | null> {
    try {
      if (availableUserIds.length === 0) return null;
      if (availableUserIds.length === 1) return availableUserIds[0];

      // Calculate scores for each user
      const userScores = await Promise.all(
        availableUserIds.map(async (userId) => ({
          userId,
          score: await this.calculateAssignmentScore(userId, choreId)
        }))
      );

      // Sort by score (highest first)
      userScores.sort((a, b) => b.score - a.score);

      return userScores[0].userId;
    } catch (error) {
      console.error('Error getting recommended assignee:', error);
      return availableUserIds[0]; // Fallback to first available
    }
  }
}

// Export singleton instance
export const choreCardService = new ChoreCardService();