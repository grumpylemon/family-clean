// Mock React Native components for testing
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { useFormValidation, validationRules, crossFieldValidations } from '../hooks/useFormValidation';

// Since we don't have React Testing Library set up, let's focus on testing the validation rules directly
describe('useFormValidation', () => {
  // Test basic functionality without hooks for now
  it('should exist and be importable', () => {
    expect(useFormValidation).toBeDefined();
    expect(typeof useFormValidation).toBe('function');
  });
});

describe('validationRules', () => {
  describe('choreTitle', () => {
    const rule = validationRules.choreTitle();

    it('should validate chore titles', () => {
      expect(rule.validate('')).toBe(false);
      expect(rule.validate('A')).toBe(false);
      expect(rule.validate('Valid Title')).toBe(true);
      expect(rule.validate('A'.repeat(60))).toBe(false); // Too long
    });
  });

  describe('chorePoints', () => {
    const rule = validationRules.chorePoints();

    it('should validate chore points', () => {
      expect(rule.validate('0')).toBe(false);
      expect(rule.validate('1')).toBe(true);
      expect(rule.validate('50')).toBe(true);
      expect(rule.validate('100')).toBe(true);
      expect(rule.validate('101')).toBe(false);
      expect(rule.validate('abc')).toBe(false);
    });
  });

  describe('displayName', () => {
    const rule = validationRules.displayName();

    it('should validate display names', () => {
      expect(rule.validate('')).toBe(false);
      expect(rule.validate('A')).toBe(false);
      expect(rule.validate('Jo')).toBe(true);
      expect(rule.validate('Valid Display Name')).toBe(true);
      expect(rule.validate('A'.repeat(35))).toBe(false); // Too long
    });
  });

  describe('rewardName', () => {
    const rule = validationRules.rewardName();

    it('should validate reward names', () => {
      expect(rule.validate('')).toBe(false);
      expect(rule.validate('A')).toBe(false);
      expect(rule.validate('Valid Reward')).toBe(true);
      expect(rule.validate('A'.repeat(55))).toBe(false); // Too long
    });
  });

  describe('rewardCost', () => {
    const rule = validationRules.rewardCost();

    it('should validate reward costs', () => {
      expect(rule.validate('0')).toBe(false);
      expect(rule.validate('1')).toBe(true);
      expect(rule.validate('500')).toBe(true);
      expect(rule.validate('1000')).toBe(true);
      expect(rule.validate('1001')).toBe(false);
      expect(rule.validate('abc')).toBe(false);
    });
  });

  describe('email', () => {
    const rule = validationRules.email();

    it('should validate email formats', () => {
      expect(rule.validate('invalid')).toBe(false);
      expect(rule.validate('invalid@')).toBe(false);
      expect(rule.validate('invalid@domain')).toBe(false);
      expect(rule.validate('valid@domain.com')).toBe(true);
      expect(rule.validate('user.name+tag@domain.co.uk')).toBe(true);
      expect(rule.validate('')).toBe(true); // Empty is valid for optional fields
    });
  });

  describe('futureDate', () => {
    const rule = validationRules.futureDate();

    it('should validate future dates', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      
      expect(rule.validate(pastDate)).toBe(false);
      expect(rule.validate(futureDate)).toBe(true);
      expect(rule.validate('')).toBe(true); // Empty is valid for optional fields
    });
  });

  describe('positiveInteger', () => {
    const rule = validationRules.positiveInteger();

    it('should validate positive integers', () => {
      expect(rule.validate('0')).toBe(false);
      expect(rule.validate('-1')).toBe(false);
      expect(rule.validate('1')).toBe(true);
      expect(rule.validate('100')).toBe(true);
      expect(rule.validate('1.5')).toBe(false);
      expect(rule.validate('abc')).toBe(false);
      expect(rule.validate('')).toBe(true); // Empty is valid for optional fields
    });
  });
});

describe('crossFieldValidations', () => {
  describe('cooldownVsFrequency', () => {
    const validation = crossFieldValidations.cooldownVsFrequency('cooldown', 'frequency');

    it('should validate cooldown vs frequency relationship', () => {
      // Valid case: cooldown shorter than frequency
      let result = validation.validate({
        cooldown: '24', // 1 day
        frequency: '7'  // 7 days
      });
      expect(result).toBeNull();

      // Invalid case: cooldown longer than frequency
      result = validation.validate({
        cooldown: '200', // 8.3 days
        frequency: '7'   // 7 days
      });
      expect(result).not.toBeNull();
      expect(result?.field).toBe('cooldown');
      expect(result?.message).toContain('cannot be longer than frequency');

      // Edge case: equal values should be valid
      result = validation.validate({
        cooldown: '168', // 7 days
        frequency: '7'   // 7 days
      });
      expect(result).toBeNull();

      // Invalid input handling
      result = validation.validate({
        cooldown: 'abc',
        frequency: '7'
      });
      expect(result).toBeNull(); // Should handle gracefully
    });
  });
});