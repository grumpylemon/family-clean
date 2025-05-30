// Analytics Slice - Takeover analytics and insights for Zustand store
// Manages leaderboard data, chore health metrics, and family insights

import { StateCreator } from 'zustand';
import { FamilyStore } from './types';
import { ChoreTakeover, FamilyMember, Chore } from '../types';

// Analytics period types
export type AnalyticsPeriod = 'week' | 'month' | 'all_time';

// Takeover leaderboard entry
export interface TakeoverLeaderboardEntry {
  uid: string;
  name: string;
  photoURL?: string;
  takeoverCount: number;
  bonusPointsEarned: number;
  bonusXPEarned: number;
  successRate: number; // Percentage of takeovers completed
  averageCompletionTime?: number; // Hours from takeover to completion
  lastTakeoverAt?: string;
  rank: number;
}

// Chore health metrics
export interface ChoreHealthMetrics {
  totalChores: number;
  overdueChores: number;
  abandonedChores: number;
  averageCompletionTime: number; // Hours
  takeoverRate: number; // Percentage of chores that get taken over
  mostTakenOverCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  choresByStatus: {
    pending: number;
    assigned: number;
    completed: number;
    overdue: number;
    takenOver: number;
  };
  completionTrends: Array<{
    date: string;
    completed: number;
    takenOver: number;
    abandoned: number;
  }>;
}

// Family insights
export interface FamilyInsights {
  mostReliableMembers: Array<{
    uid: string;
    name: string;
    completionRate: number;
    averageDelay: number; // Hours past due date
  }>;
  choreDistributionBalance: Array<{
    uid: string;
    name: string;
    assignedCount: number;
    completedCount: number;
    workloadPercentage: number;
  }>;
  peakActivityTimes: Array<{
    hour: number;
    day: string;
    completionCount: number;
  }>;
  collaborationMetrics: {
    totalTakeovers: number;
    helpRequestsCount: number;
    tradeProposalsCount: number;
    teamworkScore: number; // 0-100
  };
  weeklyComparison: {
    currentWeek: {
      completed: number;
      takenOver: number;
      averageCompletionTime: number;
    };
    previousWeek: {
      completed: number;
      takenOver: number;
      averageCompletionTime: number;
    };
    trend: 'improving' | 'declining' | 'stable';
  };
}

// Analytics slice interface
export interface AnalyticsSlice {
  analytics: {
    // State
    takeoverLeaderboard: TakeoverLeaderboardEntry[] | null;
    choreHealthMetrics: ChoreHealthMetrics | null;
    familyInsights: FamilyInsights | null;
    selectedPeriod: AnalyticsPeriod;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    
    // Actions
    setSelectedPeriod: (period: AnalyticsPeriod) => void;
    calculateTakeoverLeaderboard: () => void;
    calculateChoreHealthMetrics: () => void;
    calculateFamilyInsights: () => void;
    refreshAnalytics: () => Promise<void>;
    clearAnalytics: () => void;
    clearError: () => void;
    
    // Helpers
    getTakeoverTrend: (memberId: string) => 'rising' | 'falling' | 'stable';
    getChoreCompletionRate: (memberId?: string) => number;
    getAverageResponseTime: (memberId?: string) => number;
    getPeakProductivityHours: () => { hour: number; count: number }[];
  };
}

export const createAnalyticsSlice: StateCreator<
  FamilyStore,
  [],
  [],
  AnalyticsSlice
> = (set, get) => ({
  analytics: {
    takeoverLeaderboard: null,
    choreHealthMetrics: null,
    familyInsights: null,
    selectedPeriod: 'week',
    isLoading: false,
    error: null,
    lastUpdated: null,

    setSelectedPeriod: (period) => {
      set((state) => ({
        analytics: { ...state.analytics, selectedPeriod: period }
      }));
      // Recalculate analytics for new period
      get().analytics.refreshAnalytics();
    },

    calculateTakeoverLeaderboard: () => {
      const { family, chores } = get();
      
      if (!family.family || !family.members.length) {
        set((state) => ({
          analytics: { ...state.analytics, takeoverLeaderboard: [] }
        }));
        return;
      }

      const period = get().analytics.selectedPeriod;
      const now = new Date();
      const startDate = getStartDateForPeriod(period);

      // Calculate leaderboard entries for each member
      const leaderboard: TakeoverLeaderboardEntry[] = family.members
        .filter(member => member.isActive)
        .map(member => {
          const takeoverHistory = member.takeoverHistory || [];
          const relevantTakeovers = takeoverHistory.filter(t => 
            new Date(t.takenOverAt) >= startDate
          );

          const completedTakeovers = relevantTakeovers.filter(t => 
            chores.chores?.data.some(c => 
              c.id === t.choreId && c.status === 'completed'
            )
          );

          const totalBonusPoints = relevantTakeovers.reduce((sum, t) => 
            sum + (t.bonusPoints || 0), 0
          );
          
          const totalBonusXP = relevantTakeovers.reduce((sum, t) => 
            sum + (t.bonusXP || 0), 0
          );

          // Calculate average completion time
          let avgCompletionTime = 0;
          if (completedTakeovers.length > 0) {
            const completionTimes = completedTakeovers.map(t => {
              const chore = chores.chores?.data.find(c => c.id === t.choreId);
              if (chore?.completedAt) {
                const takenOverTime = new Date(t.takenOverAt).getTime();
                const completedTime = new Date(chore.completedAt).getTime();
                return (completedTime - takenOverTime) / (1000 * 60 * 60); // Hours
              }
              return 0;
            }).filter(time => time > 0);

            avgCompletionTime = completionTimes.length > 0
              ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
              : 0;
          }

          return {
            uid: member.uid,
            name: member.name,
            photoURL: member.photoURL,
            takeoverCount: relevantTakeovers.length,
            bonusPointsEarned: totalBonusPoints,
            bonusXPEarned: totalBonusXP,
            successRate: relevantTakeovers.length > 0
              ? (completedTakeovers.length / relevantTakeovers.length) * 100
              : 0,
            averageCompletionTime: avgCompletionTime,
            lastTakeoverAt: member.takeoverStats?.lastTakeoverAt,
            rank: 0 // Will be set after sorting
          };
        })
        .sort((a, b) => {
          // Sort by takeover count, then by bonus points
          if (b.takeoverCount !== a.takeoverCount) {
            return b.takeoverCount - a.takeoverCount;
          }
          return b.bonusPointsEarned - a.bonusPointsEarned;
        })
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      set((state) => ({
        analytics: { ...state.analytics, takeoverLeaderboard: leaderboard }
      }));
    },

    calculateChoreHealthMetrics: () => {
      const { chores, family } = get();
      
      if (!chores.chores?.data || !family.family) {
        set((state) => ({
          analytics: { ...state.analytics, choreHealthMetrics: null }
        }));
        return;
      }

      const period = get().analytics.selectedPeriod;
      const startDate = getStartDateForPeriod(period);
      const choreData = chores.chores.data;

      // Filter chores within the period
      const relevantChores = choreData.filter(c => 
        new Date(c.createdAt) >= startDate
      );

      // Calculate status counts
      const now = new Date();
      const choresByStatus = {
        pending: 0,
        assigned: 0,
        completed: 0,
        overdue: 0,
        takenOver: 0
      };

      relevantChores.forEach(chore => {
        if (chore.status === 'completed') {
          choresByStatus.completed++;
        } else if (chore.assignedTo) {
          if (new Date(chore.dueDate) < now) {
            choresByStatus.overdue++;
          } else {
            choresByStatus.assigned++;
          }
        } else {
          choresByStatus.pending++;
        }
        
        if (chore.isTakenOver) {
          choresByStatus.takenOver++;
        }
      });

      // Calculate average completion time
      const completedChores = relevantChores.filter(c => c.status === 'completed');
      let avgCompletionTime = 0;
      if (completedChores.length > 0) {
        const completionTimes = completedChores.map(c => {
          if (c.completedAt && c.assignedAt) {
            const assigned = new Date(c.assignedAt).getTime();
            const completed = new Date(c.completedAt).getTime();
            return (completed - assigned) / (1000 * 60 * 60); // Hours
          }
          return 0;
        }).filter(time => time > 0);

        avgCompletionTime = completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0;
      }

      // Calculate takeover rate
      const takeoverRate = relevantChores.length > 0
        ? (choresByStatus.takenOver / relevantChores.length) * 100
        : 0;

      // Calculate most taken over categories
      const categoryTakeovers: Record<string, number> = {};
      relevantChores.filter(c => c.isTakenOver).forEach(chore => {
        const category = chore.category || 'general';
        categoryTakeovers[category] = (categoryTakeovers[category] || 0) + 1;
      });

      const mostTakenOverCategories = Object.entries(categoryTakeovers)
        .map(([category, count]) => ({
          category,
          count,
          percentage: choresByStatus.takenOver > 0
            ? (count / choresByStatus.takenOver) * 100
            : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate completion trends (last 7 days)
      const trends: ChoreHealthMetrics['completionTrends'] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dayChores = relevantChores.filter(c => {
          const choreDate = new Date(c.completedAt || c.createdAt);
          return choreDate >= date && choreDate < nextDate;
        });

        trends.push({
          date: date.toISOString().split('T')[0],
          completed: dayChores.filter(c => c.status === 'completed').length,
          takenOver: dayChores.filter(c => c.isTakenOver).length,
          abandoned: dayChores.filter(c => 
            c.status !== 'completed' && new Date(c.dueDate) < date
          ).length
        });
      }

      const metrics: ChoreHealthMetrics = {
        totalChores: relevantChores.length,
        overdueChores: choresByStatus.overdue,
        abandonedChores: relevantChores.filter(c => 
          c.status !== 'completed' && 
          new Date(c.dueDate) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        averageCompletionTime: avgCompletionTime,
        takeoverRate,
        mostTakenOverCategories,
        choresByStatus,
        completionTrends: trends
      };

      set((state) => ({
        analytics: { ...state.analytics, choreHealthMetrics: metrics }
      }));
    },

    calculateFamilyInsights: () => {
      const { family, chores } = get();
      
      if (!family.family || !chores.chores?.data) {
        set((state) => ({
          analytics: { ...state.analytics, familyInsights: null }
        }));
        return;
      }

      const period = get().analytics.selectedPeriod;
      const startDate = getStartDateForPeriod(period);
      const choreData = chores.chores.data.filter(c => 
        new Date(c.createdAt) >= startDate
      );

      // Calculate most reliable members
      const memberStats = family.members.map(member => {
        const assignedChores = choreData.filter(c => c.assignedTo === member.uid);
        const completedChores = assignedChores.filter(c => c.status === 'completed');
        
        let totalDelay = 0;
        let delayCount = 0;
        
        completedChores.forEach(chore => {
          if (chore.completedAt && chore.dueDate) {
            const delay = new Date(chore.completedAt).getTime() - new Date(chore.dueDate).getTime();
            if (delay > 0) {
              totalDelay += delay / (1000 * 60 * 60); // Convert to hours
              delayCount++;
            }
          }
        });

        return {
          uid: member.uid,
          name: member.name,
          completionRate: assignedChores.length > 0
            ? (completedChores.length / assignedChores.length) * 100
            : 0,
          averageDelay: delayCount > 0 ? totalDelay / delayCount : 0,
          assignedCount: assignedChores.length,
          completedCount: completedChores.length
        };
      });

      const mostReliableMembers = memberStats
        .filter(m => m.assignedCount >= 5) // Minimum threshold
        .sort((a, b) => {
          // Sort by completion rate, then by average delay
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate;
          }
          return a.averageDelay - b.averageDelay;
        })
        .slice(0, 3)
        .map(({ uid, name, completionRate, averageDelay }) => ({
          uid, name, completionRate, averageDelay
        }));

      // Calculate chore distribution balance
      const totalAssigned = memberStats.reduce((sum, m) => sum + m.assignedCount, 0);
      const choreDistributionBalance = memberStats.map(m => ({
        uid: m.uid,
        name: m.name,
        assignedCount: m.assignedCount,
        completedCount: m.completedCount,
        workloadPercentage: totalAssigned > 0
          ? (m.assignedCount / totalAssigned) * 100
          : 0
      }));

      // Calculate peak activity times
      const activityByHour: Record<string, number> = {};
      choreData.filter(c => c.completedAt).forEach(chore => {
        const date = new Date(chore.completedAt!);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const key = `${day}-${hour}`;
        activityByHour[key] = (activityByHour[key] || 0) + 1;
      });

      const peakActivityTimes = Object.entries(activityByHour)
        .map(([key, count]) => {
          const [day, hour] = key.split('-');
          return { day, hour: parseInt(hour), completionCount: count };
        })
        .sort((a, b) => b.completionCount - a.completionCount)
        .slice(0, 5);

      // Calculate collaboration metrics
      const totalTakeovers = family.members.reduce((sum, m) => 
        sum + (m.takeoverStats?.choresTakenOver || 0), 0
      );

      // TODO: Add help requests and trade proposals when implemented
      const helpRequestsCount = 0;
      const tradeProposalsCount = 0;
      
      // Calculate teamwork score (0-100)
      const teamworkFactors = {
        takeoverRate: Math.min((totalTakeovers / choreData.length) * 100, 30),
        distributionBalance: Math.max(0, 30 - (Math.max(...choreDistributionBalance.map(m => 
          Math.abs(m.workloadPercentage - (100 / family.members.length))
        )))),
        completionRate: (choreData.filter(c => c.status === 'completed').length / choreData.length) * 40
      };
      
      const teamworkScore = Object.values(teamworkFactors).reduce((a, b) => a + b, 0);

      // Calculate weekly comparison
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const currentWeekChores = choreData.filter(c => 
        new Date(c.createdAt) >= oneWeekAgo
      );
      const previousWeekChores = choreData.filter(c => 
        new Date(c.createdAt) >= twoWeeksAgo && new Date(c.createdAt) < oneWeekAgo
      );

      const calculateWeekStats = (chores: Chore[]) => {
        const completed = chores.filter(c => c.status === 'completed');
        const takenOver = chores.filter(c => c.isTakenOver);
        
        let totalCompletionTime = 0;
        let completionCount = 0;
        
        completed.forEach(chore => {
          if (chore.completedAt && chore.assignedAt) {
            const time = new Date(chore.completedAt).getTime() - new Date(chore.assignedAt).getTime();
            totalCompletionTime += time / (1000 * 60 * 60); // Hours
            completionCount++;
          }
        });

        return {
          completed: completed.length,
          takenOver: takenOver.length,
          averageCompletionTime: completionCount > 0
            ? totalCompletionTime / completionCount
            : 0
        };
      };

      const currentWeekStats = calculateWeekStats(currentWeekChores);
      const previousWeekStats = calculateWeekStats(previousWeekChores);

      // Determine trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      const completionDiff = currentWeekStats.completed - previousWeekStats.completed;
      const timeDiff = previousWeekStats.averageCompletionTime - currentWeekStats.averageCompletionTime;
      
      if (completionDiff > 2 || timeDiff > 2) {
        trend = 'improving';
      } else if (completionDiff < -2 || timeDiff < -2) {
        trend = 'declining';
      }

      const insights: FamilyInsights = {
        mostReliableMembers,
        choreDistributionBalance,
        peakActivityTimes,
        collaborationMetrics: {
          totalTakeovers,
          helpRequestsCount,
          tradeProposalsCount,
          teamworkScore
        },
        weeklyComparison: {
          currentWeek: currentWeekStats,
          previousWeek: previousWeekStats,
          trend
        }
      };

      set((state) => ({
        analytics: { ...state.analytics, familyInsights: insights }
      }));
    },

    refreshAnalytics: async () => {
      set((state) => ({
        analytics: { ...state.analytics, isLoading: true, error: null }
      }));

      try {
        // Calculate all analytics
        get().analytics.calculateTakeoverLeaderboard();
        get().analytics.calculateChoreHealthMetrics();
        get().analytics.calculateFamilyInsights();

        set((state) => ({
          analytics: {
            ...state.analytics,
            isLoading: false,
            lastUpdated: new Date()
          }
        }));
      } catch (error) {
        console.error('[AnalyticsSlice] Error refreshing analytics:', error);
        set((state) => ({
          analytics: {
            ...state.analytics,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh analytics'
          }
        }));
      }
    },

    clearAnalytics: () => {
      set((state) => ({
        analytics: {
          ...state.analytics,
          takeoverLeaderboard: null,
          choreHealthMetrics: null,
          familyInsights: null,
          lastUpdated: null
        }
      }));
    },

    clearError: () => {
      set((state) => ({
        analytics: { ...state.analytics, error: null }
      }));
    },

    getTakeoverTrend: (memberId) => {
      const leaderboard = get().analytics.takeoverLeaderboard;
      if (!leaderboard) return 'stable';

      const member = leaderboard.find(m => m.uid === memberId);
      if (!member) return 'stable';

      // Compare with previous period
      // This is a simplified implementation
      // In a real app, you'd store historical data
      const stats = get().family.members.find(m => m.uid === memberId)?.takeoverStats;
      if (!stats) return 'stable';

      const recentRate = member.takeoverCount / 7; // Per day
      const historicalRate = stats.choresTakenOver / 30; // Rough estimate

      if (recentRate > historicalRate * 1.2) return 'rising';
      if (recentRate < historicalRate * 0.8) return 'falling';
      return 'stable';
    },

    getChoreCompletionRate: (memberId) => {
      const { chores } = get();
      if (!chores.chores?.data) return 0;

      const memberChores = memberId
        ? chores.chores.data.filter(c => c.assignedTo === memberId)
        : chores.chores.data;

      if (memberChores.length === 0) return 0;

      const completed = memberChores.filter(c => c.status === 'completed').length;
      return (completed / memberChores.length) * 100;
    },

    getAverageResponseTime: (memberId) => {
      const { chores } = get();
      if (!chores.chores?.data) return 0;

      const completedChores = chores.chores.data.filter(c => 
        c.status === 'completed' &&
        c.completedAt &&
        c.assignedAt &&
        (!memberId || c.assignedTo === memberId)
      );

      if (completedChores.length === 0) return 0;

      const totalTime = completedChores.reduce((sum, chore) => {
        const assigned = new Date(chore.assignedAt!).getTime();
        const completed = new Date(chore.completedAt!).getTime();
        return sum + (completed - assigned);
      }, 0);

      return totalTime / completedChores.length / (1000 * 60 * 60); // Convert to hours
    },

    getPeakProductivityHours: () => {
      const insights = get().analytics.familyInsights;
      if (!insights) return [];

      return insights.peakActivityTimes
        .map(({ hour, completionCount }) => ({ hour, count: completionCount }))
        .sort((a, b) => b.count - a.count);
    }
  }
});

// Helper function to get start date based on period
function getStartDateForPeriod(period: AnalyticsPeriod): Date {
  const date = new Date();
  
  switch (period) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'all_time':
      date.setFullYear(2020); // Set to a date before the app existed
      break;
  }
  
  date.setHours(0, 0, 0, 0);
  return date;
}