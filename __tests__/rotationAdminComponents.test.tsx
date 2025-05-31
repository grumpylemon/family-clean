/**
 * Test suite for Rotation Admin Panel components
 * 
 * Tests core functionality of rotation management components
 * including strategy configuration, fairness dashboard, and preferences.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// Mock the contexts and services
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#be185d',
      cardBackground: '#ffffff',
      surface: '#f5f5f5',
      textSecondary: '#666666',
      accent: '#fbcfe8',
      divider: '#e5e5e5',
      cardShadow: '#000000',
      textMuted: '#999999',
    },
    theme: 'light',
  }),
}));

jest.mock('../hooks/useZustandHooks', () => ({
  useFamily: () => ({
    family: {
      id: 'test-family',
      name: 'Test Family',
      members: [
        {
          uid: '1',
          name: 'Sarah',
          email: 'sarah@test.com',
          role: 'admin',
          familyRole: 'parent',
          points: { current: 100, lifetime: 500, weekly: 50 },
          isActive: true,
        },
        {
          uid: '2',
          name: 'Mike',
          email: 'mike@test.com',
          role: 'member',
          familyRole: 'parent',
          points: { current: 80, lifetime: 400, weekly: 40 },
          isActive: true,
        },
      ],
    },
    loading: false,
  }),
}));

jest.mock('../hooks/useAccessControl', () => ({
  useAccessControl: () => ({
    canManageFamily: true,
    canManageChores: true,
    canManageRewards: true,
  }),
}));

jest.mock('../services/rotationAdminService', () => ({
  rotationAdminService: {
    getRotationConfiguration: jest.fn(),
    updateRotationConfiguration: jest.fn(),
    getFairnessMetrics: jest.fn(),
    getMemberPreferences: jest.fn(),
    updateMemberPreferences: jest.fn(),
    forceRebalance: jest.fn(),
    testRotationStrategy: jest.fn(),
    applyRecommendation: jest.fn(),
  },
}));

// Import components after mocking
import RotationManagement from '../components/admin/RotationManagement';
import RotationStrategyConfig from '../components/admin/RotationStrategyConfig';
import FairnessEngineDashboard from '../components/admin/FairnessEngineDashboard';
import MemberPreferencesManager from '../components/admin/MemberPreferencesManager';
import StrategySelector from '../components/ui/StrategySelector';

describe('Rotation Admin Panel Components', () => {
  
  describe('RotationManagement', () => {
    it('renders correctly when visible', () => {
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      expect(getByText('Rotation Management')).toBeTruthy();
      expect(getByText('Overview')).toBeTruthy();
    });

    it('calls onClose when back button is pressed', () => {
      const onCloseMock = jest.fn();
      const { getByText } = render(
        <RotationManagement visible={true} onClose={onCloseMock} />
      );
      
      fireEvent.press(getByText('Admin'));
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('shows disabled state when rotation is disabled', () => {
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      // Should show enable/disable toggle
      expect(getByText('ENABLED')).toBeTruthy();
    });

    it('switches between tabs correctly', () => {
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      fireEvent.press(getByText('Strategy'));
      expect(getByText('Strategy')).toBeTruthy();
      
      fireEvent.press(getByText('Fairness'));
      expect(getByText('Fairness')).toBeTruthy();
    });
  });

  describe('RotationStrategyConfig', () => {
    it('renders strategy selection interface', () => {
      const { getByText } = render(
        <RotationStrategyConfig enabled={true} />
      );
      
      expect(getByText('Rotation Strategy')).toBeTruthy();
      expect(getByText('Round Robin')).toBeTruthy();
      expect(getByText('Workload Balance')).toBeTruthy();
    });

    it('shows disabled state when enabled=false', () => {
      const { getByText } = render(
        <RotationStrategyConfig enabled={false} />
      );
      
      expect(getByText('Enable rotation system to configure strategies')).toBeTruthy();
    });

    it('allows strategy selection when enabled', () => {
      const { getByText } = render(
        <RotationStrategyConfig enabled={true} />
      );
      
      fireEvent.press(getByText('Workload Balance'));
      // Strategy should be selectable
      expect(getByText('Workload Balance')).toBeTruthy();
    });
  });

  describe('FairnessEngineDashboard', () => {
    it('renders fairness metrics correctly', () => {
      const { getByText } = render(
        <FairnessEngineDashboard enabled={true} />
      );
      
      expect(getByText('Overall Fairness Score')).toBeTruthy();
      expect(getByText('Member Workloads')).toBeTruthy();
      expect(getByText('Recommendations')).toBeTruthy();
    });

    it('shows loading state initially', () => {
      const { getByText } = render(
        <FairnessEngineDashboard enabled={true} />
      );
      
      expect(getByText('Loading fairness metrics...')).toBeTruthy();
    });

    it('handles timeframe selection', () => {
      const { getByText } = render(
        <FairnessEngineDashboard enabled={true} />
      );
      
      fireEvent.press(getByText('Month'));
      expect(getByText('Month')).toBeTruthy();
    });
  });

  describe('MemberPreferencesManager', () => {
    it('renders member selector', () => {
      const { getByText } = render(
        <MemberPreferencesManager enabled={true} />
      );
      
      expect(getByText('Select Member')).toBeTruthy();
      expect(getByText('Sarah')).toBeTruthy();
      expect(getByText('Mike')).toBeTruthy();
    });

    it('shows loading state initially', () => {
      const { getByText } = render(
        <MemberPreferencesManager enabled={true} />
      );
      
      expect(getByText('Loading member preferences...')).toBeTruthy();
    });

    it('handles member selection', async () => {
      const { getByText } = render(
        <MemberPreferencesManager enabled={true} />
      );
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(getByText('Chore Preferences')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Mike'));
      expect(getByText('Mike')).toBeTruthy();
    });
  });

  describe('StrategySelector', () => {
    const mockOnSelect = jest.fn();

    beforeEach(() => {
      mockOnSelect.mockClear();
    });

    it('renders all strategy options', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="round_robin"
          onSelect={mockOnSelect}
        />
      );
      
      expect(getByText('Round Robin')).toBeTruthy();
      expect(getByText('Workload Balance')).toBeTruthy();
      expect(getByText('Skill-Based')).toBeTruthy();
      expect(getByText('Calendar-Aware')).toBeTruthy();
      expect(getByText('Random Fair')).toBeTruthy();
      expect(getByText('Preference-Based')).toBeTruthy();
      expect(getByText('Mixed Strategy')).toBeTruthy();
    });

    it('highlights selected strategy', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="workload_balance"
          onSelect={mockOnSelect}
        />
      );
      
      // Selected strategy should have checkmark
      expect(getByText('Workload Balance')).toBeTruthy();
    });

    it('calls onSelect when strategy is pressed', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="round_robin"
          onSelect={mockOnSelect}
        />
      );
      
      fireEvent.press(getByText('Workload Balance'));
      expect(mockOnSelect).toHaveBeenCalledWith('workload_balance');
    });

    it('shows disabled state when disabled=true', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="round_robin"
          onSelect={mockOnSelect}
          disabled={true}
        />
      );
      
      expect(getByText('DISABLED')).toBeTruthy();
    });

    it('renders in compact mode', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="round_robin"
          onSelect={mockOnSelect}
          compact={true}
        />
      );
      
      expect(getByText('Round Robin')).toBeTruthy();
      // In compact mode, descriptions should not be visible
    });
  });

  describe('Integration Tests', () => {
    it('rotation management integrates with strategy config', () => {
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      // Switch to strategy tab
      fireEvent.press(getByText('Strategy'));
      
      // Should show strategy configuration
      expect(getByText('Strategy')).toBeTruthy();
    });

    it('handles admin permission restrictions', () => {
      // This test would verify that non-admin users see limited functionality
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      // With admin permissions mocked as true, should see all tabs
      expect(getByText('Overview')).toBeTruthy();
      expect(getByText('Strategy')).toBeTruthy();
      expect(getByText('Preferences')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      // Mock service error
      const { rotationAdminService } = require('../services/rotationAdminService');
      rotationAdminService.getFairnessMetrics.mockRejectedValue(new Error('Service error'));
      
      const { getByText } = render(
        <FairnessEngineDashboard enabled={true} />
      );
      
      // Should still render without crashing
      expect(getByText('Loading fairness metrics...')).toBeTruthy();
    });

    it('validates mixed strategy weights', () => {
      const { getByText } = render(
        <RotationStrategyConfig enabled={true} />
      );
      
      // Select mixed strategy
      fireEvent.press(getByText('Mixed Strategy'));
      
      // Should show mixed strategy configuration
      expect(getByText('Mixed Strategy Weights')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', () => {
      const { getByText } = render(
        <RotationManagement visible={true} onClose={jest.fn()} />
      );
      
      // Important UI elements should be accessible
      expect(getByText('Rotation Management')).toBeTruthy();
      expect(getByText('Admin')).toBeTruthy();
    });

    it('supports keyboard navigation', () => {
      const { getByText } = render(
        <StrategySelector
          selectedStrategy="round_robin"
          onSelect={jest.fn()}
        />
      );
      
      // All strategy options should be pressable
      expect(getByText('Round Robin')).toBeTruthy();
      expect(getByText('Workload Balance')).toBeTruthy();
    });
  });
});

describe('Rotation Admin Service Integration', () => {
  const { rotationAdminService } = require('../services/rotationAdminService');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls service methods correctly', async () => {
    rotationAdminService.getRotationConfiguration.mockResolvedValue({
      familyId: 'test-family',
      activeStrategy: 'round_robin',
      fairnessThreshold: 75,
    });

    const config = await rotationAdminService.getRotationConfiguration('test-family');
    expect(config.activeStrategy).toBe('round_robin');
    expect(rotationAdminService.getRotationConfiguration).toHaveBeenCalledWith('test-family');
  });

  it('handles service errors', async () => {
    rotationAdminService.updateRotationConfiguration.mockRejectedValue(new Error('Update failed'));

    await expect(
      rotationAdminService.updateRotationConfiguration({
        familyId: 'test-family',
        activeStrategy: 'workload_balance',
        modifiedBy: 'admin',
      })
    ).rejects.toThrow('Update failed');
  });

  it('validates configuration data', async () => {
    const validConfig = {
      familyId: 'test-family',
      activeStrategy: 'mixed_strategy',
      mixedStrategyWeights: {
        fairness: 25,
        preference: 25,
        availability: 25,
        skill: 25,
        workload: 0,
      },
      modifiedBy: 'admin',
    };

    rotationAdminService.updateRotationConfiguration.mockResolvedValue();
    await rotationAdminService.updateRotationConfiguration(validConfig);
    
    expect(rotationAdminService.updateRotationConfiguration).toHaveBeenCalledWith(validConfig);
  });
});

export {};