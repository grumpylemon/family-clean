/**
 * Schedule Intelligence Service
 * Handles calendar integration, availability checking, and conflict detection for rotation system
 */

import { ScheduleConflict, TimeRange } from '../types/rotation';

interface AvailabilityResult {
  score: number; // 0-100, higher is better availability
  conflicts: ScheduleConflict[];
  suggestedTimes: string[];
  reasoning: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: 'work' | 'personal' | 'family' | 'travel' | 'other';
}

class ScheduleIntelligence {
  private calendarCache = new Map<string, { events: CalendarEvent[]; expiry: number }>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Check member availability for a specific time period
   */
  public async checkMemberAvailability(
    memberId: string,
    targetDate: string,
    durationMinutes: number
  ): Promise<AvailabilityResult> {
    try {
      // Get member's calendar events
      const events = await this.getMemberCalendarEvents(memberId, targetDate);
      
      // Get member's availability preferences
      const preferences = await this.getMemberAvailabilityPreferences(memberId);
      
      // Calculate availability score and conflicts
      const result = this.analyzeAvailability(
        events,
        preferences,
        targetDate,
        durationMinutes
      );

      return result;

    } catch (error) {
      console.error('Error checking member availability:', error);
      
      // Return default availability on error
      return {
        score: 70, // Moderate availability assumption
        conflicts: [{
          type: 'availability',
          severity: 'low',
          description: 'Unable to check calendar - using default availability',
          canOverride: true
        }],
        suggestedTimes: [],
        reasoning: 'Calendar check failed - assuming moderate availability'
      };
    }
  }

  /**
   * Get calendar events for a member (mock implementation for now)
   */
  private async getMemberCalendarEvents(
    memberId: string,
    targetDate: string
  ): Promise<CalendarEvent[]> {
    // Check cache first
    const cacheKey = `${memberId}-${targetDate.split('T')[0]}`;
    const cached = this.calendarCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.events;
    }

    // In a real implementation, this would call Google Calendar API
    // For now, return mock data based on patterns
    const events = this.generateMockCalendarEvents(memberId, targetDate);
    
    // Cache the results
    this.calendarCache.set(cacheKey, {
      events,
      expiry: Date.now() + this.CACHE_DURATION
    });

    return events;
  }

  /**
   * Generate mock calendar events for testing
   */
  private generateMockCalendarEvents(memberId: string, targetDate: string): CalendarEvent[] {
    const date = new Date(targetDate);
    const events: CalendarEvent[] = [];

    // Generate realistic mock events based on day of week
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekday) {
      // Work hours
      events.push({
        id: `work-${date.toISOString()}`,
        title: 'Work',
        startTime: this.setTimeOnDate(date, 9, 0).toISOString(),
        endTime: this.setTimeOnDate(date, 17, 0).toISOString(),
        type: 'work'
      });

      // Commute
      events.push({
        id: `commute-am-${date.toISOString()}`,
        title: 'Commute to work',
        startTime: this.setTimeOnDate(date, 8, 0).toISOString(),
        endTime: this.setTimeOnDate(date, 9, 0).toISOString(),
        type: 'travel'
      });

      events.push({
        id: `commute-pm-${date.toISOString()}`,
        title: 'Commute from work',
        startTime: this.setTimeOnDate(date, 17, 0).toISOString(),
        endTime: this.setTimeOnDate(date, 18, 0).toISOString(),
        type: 'travel'
      });
    }

    if (isWeekend) {
      // Weekend family activities (random)
      if (Math.random() > 0.5) {
        events.push({
          id: `family-${date.toISOString()}`,
          title: 'Family Time',
          startTime: this.setTimeOnDate(date, 10, 0).toISOString(),
          endTime: this.setTimeOnDate(date, 14, 0).toISOString(),
          type: 'family'
        });
      }
    }

    // Random evening events
    if (Math.random() > 0.7) {
      events.push({
        id: `evening-${date.toISOString()}`,
        title: 'Evening Plans',
        startTime: this.setTimeOnDate(date, 19, 0).toISOString(),
        endTime: this.setTimeOnDate(date, 21, 0).toISOString(),
        type: 'personal'
      });
    }

    return events;
  }

  /**
   * Get member's availability preferences (mock implementation)
   */
  private async getMemberAvailabilityPreferences(memberId: string): Promise<{
    preferredTimes: TimeRange[];
    unavailableTimes: TimeRange[];
    energyPatterns: Array<{ timeRange: TimeRange; level: 'low' | 'medium' | 'high' }>;
  }> {
    // In real implementation, this would fetch from user preferences
    return {
      preferredTimes: [
        {
          startHour: 9,
          endHour: 11,
          daysOfWeek: [6, 0], // Weekend mornings
          enabled: true
        },
        {
          startHour: 19,
          endHour: 21,
          daysOfWeek: [1, 2, 3, 4, 5], // Weekday evenings
          enabled: true
        }
      ],
      unavailableTimes: [
        {
          startHour: 22,
          endHour: 7,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Night hours
          enabled: true
        }
      ],
      energyPatterns: [
        {
          timeRange: {
            startHour: 6,
            endHour: 10,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            enabled: true
          },
          level: 'high'
        },
        {
          timeRange: {
            startHour: 13,
            endHour: 15,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            enabled: true
          },
          level: 'low'
        }
      ]
    };
  }

  /**
   * Analyze availability and generate score with conflicts
   */
  private analyzeAvailability(
    events: CalendarEvent[],
    preferences: any,
    targetDate: string,
    durationMinutes: number
  ): AvailabilityResult {
    const date = new Date(targetDate);
    const conflicts: ScheduleConflict[] = [];
    let baseScore = 100;

    // Check for direct calendar conflicts
    const choreEndTime = new Date(date.getTime() + durationMinutes * 60 * 1000);
    
    for (const event of events) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Check for overlap
      if (this.timeRangesOverlap(date, choreEndTime, eventStart, eventEnd)) {
        const severity = this.getConflictSeverity(event.type);
        conflicts.push({
          type: 'calendar',
          severity,
          description: `Conflicts with ${event.title} (${event.startTime} - ${event.endTime})`,
          canOverride: event.type !== 'work'
        });
        
        // Reduce score based on conflict severity
        baseScore -= severity === 'critical' ? 50 : severity === 'high' ? 30 : 15;
      }

      // Check for buffer time violations
      const bufferMinutes = this.getRequiredBufferTime(event.type);
      const bufferBefore = new Date(eventStart.getTime() - bufferMinutes * 60 * 1000);
      const bufferAfter = new Date(eventEnd.getTime() + bufferMinutes * 60 * 1000);
      
      if (this.timeRangesOverlap(date, choreEndTime, bufferBefore, eventStart) ||
          this.timeRangesOverlap(date, choreEndTime, eventEnd, bufferAfter)) {
        conflicts.push({
          type: 'calendar',
          severity: 'medium',
          description: `Too close to ${event.title} - insufficient buffer time`,
          canOverride: true
        });
        baseScore -= 10;
      }
    }

    // Check preference alignment
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Check if time falls in preferred hours
    const inPreferredTime = preferences.preferredTimes.some((range: TimeRange) =>
      range.enabled &&
      range.daysOfWeek.includes(dayOfWeek) &&
      hour >= range.startHour &&
      hour < range.endHour
    );

    if (inPreferredTime) {
      baseScore += 15;
    }

    // Check if time falls in unavailable hours
    const inUnavailableTime = preferences.unavailableTimes.some((range: TimeRange) =>
      range.enabled &&
      range.daysOfWeek.includes(dayOfWeek) &&
      hour >= range.startHour &&
      hour < range.endHour
    );

    if (inUnavailableTime) {
      conflicts.push({
        type: 'preference',
        severity: 'medium',
        description: 'Time falls in member\'s unavailable hours',
        canOverride: true
      });
      baseScore -= 25;
    }

    // Check energy levels
    const energyPattern = preferences.energyPatterns.find((pattern: any) =>
      pattern.timeRange.enabled &&
      pattern.timeRange.daysOfWeek.includes(dayOfWeek) &&
      hour >= pattern.timeRange.startHour &&
      hour < pattern.timeRange.endHour
    );

    if (energyPattern) {
      if (energyPattern.level === 'high') {
        baseScore += 10;
      } else if (energyPattern.level === 'low') {
        baseScore -= 10;
      }
    }

    // Generate suggested alternative times
    const suggestedTimes = this.generateSuggestedTimes(
      date,
      events,
      preferences,
      durationMinutes
    );

    // Create reasoning
    let reasoning = `Availability score: ${Math.max(0, baseScore)}`;
    if (conflicts.length > 0) {
      reasoning += `, ${conflicts.length} conflict(s) detected`;
    }
    if (inPreferredTime) {
      reasoning += ', in preferred time window';
    }
    if (energyPattern) {
      reasoning += `, ${energyPattern.level} energy period`;
    }

    return {
      score: Math.max(0, Math.min(100, baseScore)),
      conflicts,
      suggestedTimes,
      reasoning
    };
  }

  /**
   * Generate suggested alternative times with better availability
   */
  private generateSuggestedTimes(
    originalDate: Date,
    events: CalendarEvent[],
    preferences: any,
    durationMinutes: number
  ): string[] {
    const suggestions: string[] = [];
    const sameDay = new Date(originalDate);
    
    // Try different hours on the same day
    for (let hour = 6; hour <= 22; hour++) {
      const testDate = this.setTimeOnDate(sameDay, hour, 0);
      const testEndDate = new Date(testDate.getTime() + durationMinutes * 60 * 1000);
      
      // Check if this time has better availability
      const hasConflicts = events.some(event => 
        this.timeRangesOverlap(
          testDate, 
          testEndDate, 
          new Date(event.startTime), 
          new Date(event.endTime)
        )
      );
      
      if (!hasConflicts && suggestions.length < 3) {
        suggestions.push(testDate.toISOString());
      }
    }

    // If no good times today, suggest tomorrow
    if (suggestions.length === 0) {
      const tomorrow = new Date(originalDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Suggest morning time tomorrow
      const morningTime = this.setTimeOnDate(tomorrow, 9, 0);
      suggestions.push(morningTime.toISOString());
    }

    return suggestions;
  }

  /**
   * Utility methods
   */
  private timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  private setTimeOnDate(date: Date, hour: number, minute: number): Date {
    const newDate = new Date(date);
    newDate.setHours(hour, minute, 0, 0);
    return newDate;
  }

  private getConflictSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (eventType) {
      case 'work':
        return 'critical';
      case 'travel':
        return 'high';
      case 'family':
        return 'medium';
      case 'personal':
        return 'low';
      default:
        return 'medium';
    }
  }

  private getRequiredBufferTime(eventType: string): number {
    switch (eventType) {
      case 'work':
        return 30; // 30 minutes buffer for work
      case 'travel':
        return 15; // 15 minutes buffer for travel
      case 'family':
        return 10; // 10 minutes buffer for family events
      default:
        return 5; // 5 minutes default buffer
    }
  }

  /**
   * Batch availability checking for multiple members
   */
  public async checkMultipleMemberAvailability(
    memberIds: string[],
    targetDate: string,
    durationMinutes: number
  ): Promise<Record<string, AvailabilityResult>> {
    const results: Record<string, AvailabilityResult> = {};

    // Check availability for each member in parallel
    const checks = memberIds.map(async memberId => {
      const result = await this.checkMemberAvailability(memberId, targetDate, durationMinutes);
      return { memberId, result };
    });

    const completedChecks = await Promise.all(checks);
    
    for (const { memberId, result } of completedChecks) {
      results[memberId] = result;
    }

    return results;
  }

  /**
   * Find optimal time for a group activity
   */
  public async findOptimalGroupTime(
    memberIds: string[],
    targetDate: string,
    durationMinutes: number,
    flexibilityHours: number = 6
  ): Promise<{
    optimalTime: string;
    memberAvailability: Record<string, AvailabilityResult>;
    groupScore: number;
    reasoning: string;
  }> {
    const baseDate = new Date(targetDate);
    let bestTime = targetDate;
    let bestScore = 0;
    let bestAvailability: Record<string, AvailabilityResult> = {};

    // Try different times within the flexibility window
    for (let hourOffset = -flexibilityHours; hourOffset <= flexibilityHours; hourOffset++) {
      const testDate = new Date(baseDate.getTime() + hourOffset * 60 * 60 * 1000);
      const testDateString = testDate.toISOString();
      
      const availability = await this.checkMultipleMemberAvailability(
        memberIds,
        testDateString,
        durationMinutes
      );

      // Calculate group score
      const scores = Object.values(availability).map(a => a.score);
      const groupScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      if (groupScore > bestScore) {
        bestScore = groupScore;
        bestTime = testDateString;
        bestAvailability = availability;
      }
    }

    return {
      optimalTime: bestTime,
      memberAvailability: bestAvailability,
      groupScore: bestScore,
      reasoning: `Found optimal time with ${bestScore.toFixed(1)}% group availability`
    };
  }

  /**
   * Clear calendar cache (useful for testing or when permissions change)
   */
  public clearCache(): void {
    this.calendarCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.calendarCache.size,
      entries: Array.from(this.calendarCache.keys())
    };
  }
}

export const scheduleIntelligence = new ScheduleIntelligence();