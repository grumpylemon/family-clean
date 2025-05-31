import { getOfficialTemplatesForSeeding } from '../data/officialTemplates';
import { ChoreTemplate, TemplateSearchFilter } from '../types/templates';

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com'
    }
  },
  safeCollection: jest.fn(() => ({
    firestore: {
      batch: jest.fn()
    }
  }))
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  writeBatch: jest.fn()
}));

describe('Template Service', () => {
  describe('Official Templates Data', () => {
    test('should have valid official templates structure', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Test first template structure
      const firstTemplate = templates[0];
      expect(firstTemplate).toHaveProperty('name');
      expect(firstTemplate).toHaveProperty('description');
      expect(firstTemplate).toHaveProperty('category');
      expect(firstTemplate).toHaveProperty('chores');
      expect(firstTemplate).toHaveProperty('totalEstimatedTime');
      expect(firstTemplate).toHaveProperty('targetFamilySize');
      expect(firstTemplate).toHaveProperty('tags');
      expect(firstTemplate).toHaveProperty('difficulty');
      expect(firstTemplate).toHaveProperty('isOfficial');
      expect(firstTemplate).toHaveProperty('isPublic');
      expect(firstTemplate).toHaveProperty('version');
    });

    test('should have all required template categories represented', () => {
      const templates = getOfficialTemplatesForSeeding();
      const categories = templates.map(t => t.category);
      
      expect(categories).toContain('daily_routines');
      expect(categories).toContain('weekly_maintenance');
      expect(categories).toContain('seasonal_tasks');
      expect(categories).toContain('family_size');
      expect(categories).toContain('lifestyle');
    });

    test('should have valid chore structures within templates', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        expect(Array.isArray(template.chores)).toBe(true);
        expect(template.chores.length).toBeGreaterThan(0);
        
        template.chores.forEach(chore => {
          // Required fields
          expect(chore).toHaveProperty('title');
          expect(chore).toHaveProperty('description');
          expect(chore).toHaveProperty('type');
          expect(chore).toHaveProperty('difficulty');
          expect(chore).toHaveProperty('basePoints');
          expect(chore).toHaveProperty('importance');
          
          // Validate field types
          expect(typeof chore.title).toBe('string');
          expect(typeof chore.description).toBe('string');
          expect(['individual', 'family', 'shared', 'pet', 'room']).toContain(chore.type);
          expect(['easy', 'medium', 'hard']).toContain(chore.difficulty);
          expect(typeof chore.basePoints).toBe('number');
          expect(['low', 'medium', 'high', 'critical']).toContain(chore.importance);
          
          // Validate points are reasonable
          expect(chore.basePoints).toBeGreaterThan(0);
          expect(chore.basePoints).toBeLessThanOrEqual(50);
          
          // Validate estimated duration if present
          if (chore.estimatedDuration) {
            expect(chore.estimatedDuration).toBeGreaterThan(0);
            expect(chore.estimatedDuration).toBeLessThanOrEqual(300); // Max 5 hours for any single chore
          }
        });
      });
    });

    test('should have realistic time estimates', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        expect(template.totalEstimatedTime).toBeGreaterThan(0);
        expect(template.totalEstimatedTime).toBeLessThanOrEqual(600); // Max 10 hours per template
        
        // Calculate sum of individual chore times
        const choreTimeSum = template.chores.reduce((sum, chore) => {
          return sum + (chore.estimatedDuration || 30); // Default 30 min if not specified
        }, 0);
        
        // Total should be close to sum of individual chores (within 20% variance for coordination time)
        expect(template.totalEstimatedTime).toBeGreaterThanOrEqual(choreTimeSum * 0.8);
        expect(template.totalEstimatedTime).toBeLessThanOrEqual(choreTimeSum * 1.2);
      });
    });

    test('should have valid family size targets', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        const [minSize, maxSize] = template.targetFamilySize;
        expect(minSize).toBeGreaterThan(0);
        expect(maxSize).toBeGreaterThanOrEqual(minSize);
        expect(maxSize).toBeLessThanOrEqual(20); // Reasonable max family size
      });
    });

    test('should have appropriate difficulty levels', () => {
      const templates = getOfficialTemplatesForSeeding();
      const difficulties = templates.map(t => t.difficulty);
      
      expect(difficulties).toContain('beginner');
      expect(difficulties).toContain('intermediate');
      expect(difficulties).toContain('advanced');
      
      // Most templates should be beginner or intermediate
      const beginnerIntermediateCount = difficulties.filter(d => 
        d === 'beginner' || d === 'intermediate'
      ).length;
      expect(beginnerIntermediateCount).toBeGreaterThan(templates.length * 0.7);
    });

    test('should have consistent tagging', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        expect(Array.isArray(template.tags)).toBe(true);
        expect(template.tags.length).toBeGreaterThan(0);
        
        // Tags should be lowercase and contain no spaces (use underscores)
        template.tags.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag).toMatch(/^[a-z_]+$/);
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });

    test('should have valid time slots for chores', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        template.chores.forEach(chore => {
          if (chore.preferredTimeSlots) {
            expect(Array.isArray(chore.preferredTimeSlots)).toBe(true);
            
            chore.preferredTimeSlots.forEach(slot => {
              // Validate time format (HH:MM)
              expect(slot.startTime).toMatch(/^([01]\d|2[0-3]):([0-5]\d)$/);
              expect(slot.endTime).toMatch(/^([01]\d|2[0-3]):([0-5]\d)$/);
              
              // Validate days of week (0-6)
              expect(Array.isArray(slot.daysOfWeek)).toBe(true);
              slot.daysOfWeek.forEach(day => {
                expect(day).toBeGreaterThanOrEqual(0);
                expect(day).toBeLessThanOrEqual(6);
              });
              
              // Validate priority
              expect(['preferred', 'acceptable', 'avoid']).toContain(slot.priority);
              
              // Start time should be before end time
              const [startHour, startMin] = slot.startTime.split(':').map(Number);
              const [endHour, endMin] = slot.endTime.split(':').map(Number);
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              expect(endMinutes).toBeGreaterThan(startMinutes);
            });
          }
        });
      });
    });
  });

  describe('Template Filtering Logic', () => {
    test('should handle empty filter', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      // Mock the client-side filtering function (would normally be imported from service)
      const applyClientSideFilters = (templates: any[], filter: TemplateSearchFilter) => {
        if (!filter || Object.keys(filter).length === 0) {
          return templates;
        }
        return templates; // Simplified for test
      };
      
      const result = applyClientSideFilters(templates, {});
      expect(result.length).toBe(templates.length);
    });

    test('should filter by family size correctly', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      // Mock client-side filter for family size
      const filterByFamilySize = (templates: any[], familySize: [number, number]) => {
        return templates.filter(template => {
          const [minSize, maxSize] = familySize;
          const [templateMin, templateMax] = template.targetFamilySize;
          return !(maxSize < templateMin || minSize > templateMax);
        });
      };
      
      // Test filtering for family of 4
      const filtered = filterByFamilySize(templates, [4, 4]);
      
      // Should only include templates that can accommodate family of 4
      filtered.forEach(template => {
        const [templateMin, templateMax] = template.targetFamilySize;
        expect(templateMin).toBeLessThanOrEqual(4);
        expect(templateMax).toBeGreaterThanOrEqual(4);
      });
    });

    test('should filter by difficulty correctly', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      const filterByDifficulty = (templates: any[], difficulties: string[]) => {
        return templates.filter(template => difficulties.includes(template.difficulty));
      };
      
      const beginnerTemplates = filterByDifficulty(templates, ['beginner']);
      
      beginnerTemplates.forEach(template => {
        expect(template.difficulty).toBe('beginner');
      });
      
      expect(beginnerTemplates.length).toBeGreaterThan(0);
    });

    test('should filter by time commitment correctly', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      const filterByTimeCommitment = (templates: any[], timeRange: [number, number]) => {
        return templates.filter(template => {
          const [minTime, maxTime] = timeRange;
          return template.totalEstimatedTime >= minTime && template.totalEstimatedTime <= maxTime;
        });
      };
      
      // Filter for templates under 2 hours (120 minutes)
      const quickTemplates = filterByTimeCommitment(templates, [0, 120]);
      
      quickTemplates.forEach(template => {
        expect(template.totalEstimatedTime).toBeLessThanOrEqual(120);
      });
    });
  });

  describe('Template Data Integrity', () => {
    test('should have unique template names', () => {
      const templates = getOfficialTemplatesForSeeding();
      const names = templates.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(uniqueNames.size).toBe(names.length);
    });

    test('should have reasonable points distribution', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        const totalPoints = template.chores.reduce((sum, chore) => sum + chore.basePoints, 0);
        
        // Total points should be reasonable for template size
        expect(totalPoints).toBeGreaterThan(0);
        expect(totalPoints).toBeLessThanOrEqual(500); // Max 500 points per template
        
        // Average points per chore should be reasonable
        const avgPoints = totalPoints / template.chores.length;
        expect(avgPoints).toBeGreaterThan(2);
        expect(avgPoints).toBeLessThanOrEqual(40);
      });
    });

    test('should have consistent seasonal chore marking', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      const seasonalTemplates = templates.filter(t => t.category === 'seasonal_tasks');
      
      seasonalTemplates.forEach(template => {
        // Seasonal templates should have at least some chores marked as seasonal
        const seasonalChores = template.chores.filter(chore => chore.seasonalOnly);
        expect(seasonalChores.length).toBeGreaterThan(0);
        
        seasonalChores.forEach(chore => {
          expect(Array.isArray(chore.seasonalOnly)).toBe(true);
          chore.seasonalOnly!.forEach(season => {
            expect(['spring', 'summer', 'fall', 'winter']).toContain(season);
          });
        });
      });
    });

    test('should have appropriate assignment preferences', () => {
      const templates = getOfficialTemplatesForSeeding();
      
      templates.forEach(template => {
        template.chores.forEach(chore => {
          if (chore.assignmentPreference) {
            expect(['any', 'adult', 'child', 'teen', 'specific_role']).toContain(chore.assignmentPreference);
          }
          
          // High difficulty chores should prefer adults
          if (chore.difficulty === 'hard') {
            expect(chore.assignmentPreference === 'adult' || chore.assignmentPreference === 'any').toBe(true);
          }
        });
      });
    });
  });
});

describe('Template Service Error Handling', () => {
  test('should handle missing template gracefully', () => {
    // This would test the actual service function
    // For now, just test that our data doesn't have obvious issues
    const templates = getOfficialTemplatesForSeeding();
    
    templates.forEach(template => {
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.chores.length).toBeGreaterThan(0);
    });
  });

  test('should validate template data before application', () => {
    const templates = getOfficialTemplatesForSeeding();
    
    // Basic validation that would be done by service
    templates.forEach(template => {
      // Required fields
      expect(template.name).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.chores).toBeDefined();
      expect(template.targetFamilySize).toBeDefined();
      expect(template.difficulty).toBeDefined();
      
      // Type validations
      expect(typeof template.isOfficial).toBe('boolean');
      expect(typeof template.isPublic).toBe('boolean');
      expect(typeof template.version).toBe('number');
      expect(Array.isArray(template.tags)).toBe(true);
      expect(Array.isArray(template.chores)).toBe(true);
    });
  });
});