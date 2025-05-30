// Test file for analytics slice
// Tests basic functionality of the analytics state management

import { createAnalyticsSlice } from '../analyticsSlice';
import { FamilyStore } from '../types';

describe('Analytics Slice', () => {
  let mockSet: jest.Mock;
  let mockGet: jest.Mock;
  let slice: any;

  beforeEach(() => {
    mockSet = jest.fn();
    mockGet = jest.fn();
    
    // Create slice with mock functions
    const sliceCreator = createAnalyticsSlice as any;
    slice = sliceCreator(mockSet, mockGet, {});
  });

  it('should create analytics slice with initial state', () => {
    expect(slice.analytics).toBeDefined();
    expect(slice.analytics.takeoverLeaderboard).toBeNull();
    expect(slice.analytics.choreHealthMetrics).toBeNull();
    expect(slice.analytics.familyInsights).toBeNull();
    expect(slice.analytics.selectedPeriod).toBe('week');
    expect(slice.analytics.isLoading).toBe(false);
    expect(slice.analytics.error).toBeNull();
    expect(slice.analytics.lastUpdated).toBeNull();
  });

  it('should have all required actions', () => {
    expect(typeof slice.analytics.setSelectedPeriod).toBe('function');
    expect(typeof slice.analytics.calculateTakeoverLeaderboard).toBe('function');
    expect(typeof slice.analytics.calculateChoreHealthMetrics).toBe('function');
    expect(typeof slice.analytics.calculateFamilyInsights).toBe('function');
    expect(typeof slice.analytics.refreshAnalytics).toBe('function');
    expect(typeof slice.analytics.clearAnalytics).toBe('function');
    expect(typeof slice.analytics.clearError).toBe('function');
    expect(typeof slice.analytics.getTakeoverTrend).toBe('function');
    expect(typeof slice.analytics.getChoreCompletionRate).toBe('function');
    expect(typeof slice.analytics.getAverageResponseTime).toBe('function');
    expect(typeof slice.analytics.getPeakProductivityHours).toBe('function');
  });

  it('should set selected period', () => {
    // Mock the get function to return current state
    mockGet.mockReturnValue({
      analytics: {
        refreshAnalytics: jest.fn()
      }
    });

    slice.analytics.setSelectedPeriod('month');

    expect(mockSet).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the state updater function
    const stateUpdater = mockSet.mock.calls[0][0];
    const newState = stateUpdater({
      analytics: { selectedPeriod: 'week' }
    });
    
    expect(newState.analytics.selectedPeriod).toBe('month');
  });

  it('should clear error', () => {
    slice.analytics.clearError();

    expect(mockSet).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the state updater function
    const stateUpdater = mockSet.mock.calls[0][0];
    const newState = stateUpdater({
      analytics: { error: 'Some error' }
    });
    
    expect(newState.analytics.error).toBeNull();
  });
});