import { BirthdayCountdown, ZodiacSign } from '../types';

// Birthday service for calculating age, countdown, and zodiac signs
export class BirthdayService {
  private static instance: BirthdayService;

  static getInstance(): BirthdayService {
    if (!BirthdayService.instance) {
      BirthdayService.instance = new BirthdayService();
    }
    return BirthdayService.instance;
  }

  // ====== AGE CALCULATION ======

  /**
   * Calculate age from birthday
   */
  calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  }

  /**
   * Determine age category based on age
   */
  getAgeCategory(age: number): 'child' | 'teen' | 'adult' {
    if (age <= 8) return 'child';
    if (age <= 12) return 'teen';
    return 'adult';
  }

  /**
   * Get age category from birthday
   */
  getAgeCategoryFromBirthday(birthday: string): 'child' | 'teen' | 'adult' {
    const age = this.calculateAge(birthday);
    return this.getAgeCategory(age);
  }

  // ====== BIRTHDAY COUNTDOWN ======

  /**
   * Calculate birthday countdown with zodiac sign
   */
  calculateBirthdayCountdown(birthday: string): BirthdayCountdown {
    const birthDate = new Date(birthday);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Calculate next birthday
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    
    // If birthday already passed this year, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    
    // Calculate days until birthday
    const timeDiff = nextBirthday.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Check if birthday is today
    const isToday = this.isSameDay(today, nextBirthday);
    
    // Check if birthday is this week (next 7 days)
    const isThisWeek = daysUntil <= 7;
    
    // Check if birthday is this month
    const isThisMonth = today.getMonth() === nextBirthday.getMonth() && 
                       today.getFullYear() === nextBirthday.getFullYear();
    
    // Get zodiac sign
    const zodiacSign = this.getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());
    
    return {
      daysUntil: isToday ? 0 : daysUntil,
      nextBirthday: nextBirthday.toISOString(),
      zodiacSign,
      isToday,
      isThisWeek,
      isThisMonth
    };
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // ====== ZODIAC SIGNS ======

  /**
   * Calculate zodiac sign from month and day
   */
  getZodiacSign(month: number, day: number): ZodiacSign {
    // Zodiac sign date ranges
    const zodiacRanges = [
      { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
      { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
      { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
      { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
      { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
      { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
      { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
      { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
      { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
      { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
      { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
      { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
    ];

    for (const range of zodiacRanges) {
      if (this.isDateInRange(month, day, range.start, range.end)) {
        return range.sign as ZodiacSign;
      }
    }

    return 'Capricorn'; // Fallback
  }

  /**
   * Check if a date falls within a zodiac range (handles year wrap-around)
   */
  private isDateInRange(
    month: number, 
    day: number, 
    start: { month: number; day: number }, 
    end: { month: number; day: number }
  ): boolean {
    const date = month * 100 + day;
    const startDate = start.month * 100 + start.day;
    const endDate = end.month * 100 + end.day;

    if (start.month <= end.month) {
      // Normal range (doesn't cross year boundary)
      return date >= startDate && date <= endDate;
    } else {
      // Range crosses year boundary (like Capricorn: Dec 22 - Jan 19)
      return date >= startDate || date <= endDate;
    }
  }

  /**
   * Get zodiac sign emoji
   */
  getZodiacEmoji(sign: ZodiacSign): string {
    const emojiMap: Record<ZodiacSign, string> = {
      'Aries': '♈',
      'Taurus': '♉',
      'Gemini': '♊',
      'Cancer': '♋',
      'Leo': '♌',
      'Virgo': '♍',
      'Libra': '♎',
      'Scorpio': '♏',
      'Sagittarius': '♐',
      'Capricorn': '♑',
      'Aquarius': '♒',
      'Pisces': '♓'
    };
    
    return emojiMap[sign] || '🌟';
  }

  /**
   * Get zodiac sign description
   */
  getZodiacDescription(sign: ZodiacSign): string {
    const descriptions: Record<ZodiacSign, string> = {
      'Aries': 'Energetic and ambitious',
      'Taurus': 'Reliable and practical',
      'Gemini': 'Curious and adaptable',
      'Cancer': 'Caring and intuitive',
      'Leo': 'Confident and generous',
      'Virgo': 'Organized and helpful',
      'Libra': 'Balanced and diplomatic',
      'Scorpio': 'Passionate and determined',
      'Sagittarius': 'Adventurous and optimistic',
      'Capricorn': 'Disciplined and responsible',
      'Aquarius': 'Independent and innovative',
      'Pisces': 'Creative and compassionate'
    };
    
    return descriptions[sign] || 'Unique and special';
  }

  // ====== BIRTHDAY UTILITIES ======

  /**
   * Validate birthday date string
   */
  validateBirthday(birthday: string): { valid: boolean; error?: string } {
    try {
      const date = new Date(birthday);
      const today = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid date format' };
      }
      
      // Check if date is not in the future
      if (date > today) {
        return { valid: false, error: 'Birthday cannot be in the future' };
      }
      
      // Check if date is not too far in the past (reasonable age limit)
      const maxAge = 150;
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - maxAge);
      
      if (date < maxDate) {
        return { valid: false, error: `Birthday cannot be more than ${maxAge} years ago` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid date format' };
    }
  }

  /**
   * Format birthday for display
   */
  formatBirthdayDisplay(birthday: string, format: 'short' | 'long' | 'relative' = 'short'): string {
    const date = new Date(birthday);
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric' 
        });
      
      case 'relative':
        const countdown = this.calculateBirthdayCountdown(birthday);
        if (countdown.isToday) {
          return 'Today! 🎉';
        } else if (countdown.daysUntil === 1) {
          return 'Tomorrow! 🎂';
        } else if (countdown.isThisWeek) {
          return `In ${countdown.daysUntil} days 🎈`;
        } else if (countdown.isThisMonth) {
          return `${countdown.daysUntil} days away`;
        } else {
          return `${Math.floor(countdown.daysUntil / 30)} months away`;
        }
      
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Get upcoming family birthdays
   */
  getUpcomingBirthdays(
    birthdays: Array<{ userId: string; name: string; birthday: string }>,
    days: number = 30
  ): Array<{ userId: string; name: string; birthday: string; countdown: BirthdayCountdown }> {
    return birthdays
      .map(member => ({
        ...member,
        countdown: this.calculateBirthdayCountdown(member.birthday)
      }))
      .filter(member => member.countdown.daysUntil <= days)
      .sort((a, b) => a.countdown.daysUntil - b.countdown.daysUntil);
  }

  /**
   * Generate birthday celebration message
   */
  generateBirthdayMessage(name: string, age: number, zodiacSign: ZodiacSign): string {
    const ageMessages = [
      `🎉 Happy Birthday, ${name}! Turning ${age} today!`,
      `🎂 ${name} is ${age} today! Time to celebrate!`,
      `🎈 Wishing ${name} an amazing ${age}th birthday!`,
      `🎁 ${name} turns ${age} today - let's make it special!`
    ];
    
    const randomMessage = ageMessages[Math.floor(Math.random() * ageMessages.length)];
    const zodiacEmoji = this.getZodiacEmoji(zodiacSign);
    
    return `${randomMessage} ${zodiacEmoji}`;
  }
}

export const birthdayService = BirthdayService.getInstance();