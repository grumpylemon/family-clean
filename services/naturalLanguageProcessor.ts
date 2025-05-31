/**
 * Natural Language Processing Engine for Enhanced Bulk Operations
 * Converts conversational requests into structured bulk operations
 */

import { 
  NLPParseResult, 
  BulkOperationIntent, 
  NLPEntity, 
  EnhancedBulkOperation,
  AIRequestContext
} from '../types/ai';
import { BulkChoreOperation } from '../types/templates';
import { geminiAIService } from './geminiAIService';

export class NaturalLanguageProcessor {
  private commandPatterns: CommandPattern[] = [];
  private entityExtractors: EntityExtractor[] = [];

  constructor() {
    this.initializePatterns();
    this.initializeEntityExtractors();
  }

  /**
   * Parse a natural language request into structured bulk operation
   */
  public async parseRequest(
    request: string,
    familyId: string,
    context: AIRequestContext
  ): Promise<NLPParseResult> {
    try {
      // Clean and normalize input
      const normalizedRequest = this.normalizeRequest(request);
      
      // Extract entities (members, chore types, times, etc.)
      const entities = this.extractEntities(normalizedRequest);
      
      // Determine intent using pattern matching and AI
      const intent = await this.determineIntent(normalizedRequest, entities, context, familyId);
      
      // Check for ambiguities that need clarification
      const ambiguities = this.detectAmbiguities(normalizedRequest, entities, intent);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(intent, entities, ambiguities);
      
      // Generate suggested operation structure
      const suggestedOperation = await this.generateOperationStructure(
        intent, 
        entities, 
        familyId, 
        context
      );

      return {
        intent,
        entities,
        confidence,
        ambiguities,
        clarificationNeeded: ambiguities.length > 0 || confidence < 0.7,
        suggestedOperation
      };
      
    } catch (error) {
      console.error('NLP parsing error:', error);
      return this.createErrorResult(request);
    }
  }

  /**
   * Generate clarification questions for ambiguous requests
   */
  public generateClarificationQuestions(parseResult: NLPParseResult): string[] {
    const questions: string[] = [];

    parseResult.ambiguities.forEach(ambiguity => {
      switch (ambiguity) {
        case 'unclear_target':
          questions.push('Which specific chores would you like to modify?');
          break;
        case 'unclear_member':
          questions.push('Which family member should be assigned these chores?');
          break;
        case 'unclear_time':
          questions.push('When should these chores be scheduled?');
          break;
        case 'unclear_scope':
          questions.push('Should this apply to all chores or just specific ones?');
          break;
        case 'unclear_operation':
          questions.push('What exactly would you like to do with these chores?');
          break;
      }
    });

    return questions;
  }

  /**
   * Apply AI-powered intent detection using Gemini
   */
  private async determineIntent(
    request: string, 
    entities: NLPEntity[], 
    context: AIRequestContext,
    familyId: string
  ): Promise<BulkOperationIntent> {
    // First try pattern matching for common requests
    const patternIntent = this.matchPatterns(request, entities);
    if (patternIntent.confidence > 0.8) {
      return patternIntent.intent;
    }

    // Use AI for complex or ambiguous requests if available
    const aiAvailable = await geminiAIService.isAvailable(familyId);
    if (aiAvailable) {
      try {
        const aiResponse = await geminiAIService.processNaturalLanguageRequest(
          request, 
          familyId,
          context
        );

        if (aiResponse.success && aiResponse.analysis?.details.intent) {
          return this.parseAIIntent(aiResponse.analysis.details.intent);
        }
      } catch (error) {
        console.warn('AI intent detection failed, falling back to patterns:', error);
      }
    }

    // Fallback to best pattern match
    return patternIntent.intent;
  }

  /**
   * Initialize command patterns for intent detection
   */
  private initializePatterns(): void {
    this.commandPatterns = [
      // Assignment patterns
      {
        pattern: /assign|give|transfer|move\s+to/i,
        intent: { type: 'assign', scope: 'selected', target: [], modifiers: {} },
        confidence: 0.9,
        examples: ['assign all kitchen chores to Sarah', 'give bathroom tasks to Mike']
      },
      
      // Scheduling patterns
      {
        pattern: /reschedule|move\s+to|change\s+to|postpone|defer/i,
        intent: { type: 'reschedule', scope: 'selected', target: [], modifiers: {} },
        confidence: 0.85,
        examples: ['reschedule to tomorrow', 'move all chores to weekend']
      },
      
      // Modification patterns
      {
        pattern: /change|modify|update|adjust|increase|decrease/i,
        intent: { type: 'modify', scope: 'selected', target: [], modifiers: {} },
        confidence: 0.8,
        examples: ['increase points for hard chores', 'change difficulty to easy']
      },
      
      // Deletion patterns
      {
        pattern: /delete|remove|cancel|eliminate/i,
        intent: { type: 'delete', scope: 'selected', target: [], modifiers: {} },
        confidence: 0.95,
        examples: ['delete all overdue chores', 'remove kitchen tasks']
      },
      
      // Creation patterns
      {
        pattern: /create|add|make|generate|new/i,
        intent: { type: 'create', scope: 'all', target: [], modifiers: {} },
        confidence: 0.8,
        examples: ['create weekly cleaning routine', 'add daily chores']
      },
      
      // Optimization patterns
      {
        pattern: /optimize|balance|distribute|reorganize|improve/i,
        intent: { type: 'optimize', scope: 'all', target: [], modifiers: {} },
        confidence: 0.75,
        examples: ['balance workload among family', 'optimize schedule efficiency']
      }
    ];
  }

  /**
   * Initialize entity extractors
   */
  private initializeEntityExtractors(): void {
    this.entityExtractors = [
      // Family member names
      {
        type: 'member',
        pattern: /\b(mom|dad|mother|father|parent|kid|child|teen|teenager|adult|sarah|mike|john|emma|alex|chris|sam|taylor|jordan|casey|riley|jamie|quinn|devon|cameron|skyler|avery|morgan|parker|blake|drew|sage|river|eden|rain)\b/gi,
        confidence: 0.8
      },
      
      // Chore types and categories
      {
        type: 'chore_type',
        pattern: /\b(kitchen|bathroom|bedroom|living\s*room|dining\s*room|cleaning|laundry|dishes|vacuum|sweep|mop|dust|trash|garbage|recycling|yard|garden|maintenance|organize)\b/gi,
        confidence: 0.85
      },
      
      // Time expressions
      {
        type: 'time',
        pattern: /\b(today|tomorrow|yesterday|morning|afternoon|evening|night|weekend|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|daily|weekly|monthly)\b/gi,
        confidence: 0.9
      },
      
      // Difficulty levels
      {
        type: 'difficulty',
        pattern: /\b(easy|simple|basic|medium|moderate|hard|difficult|challenging|complex)\b/gi,
        confidence: 0.9
      },
      
      // Point values
      {
        type: 'points',
        pattern: /\b(\d+)\s*(point|pt|pts)\b/gi,
        confidence: 0.95
      },
      
      // Rooms
      {
        type: 'room',
        pattern: /\b(kitchen|bathroom|bedroom|living\s*room|dining\s*room|garage|basement|attic|office|study|playroom|guest\s*room|master\s*bedroom|family\s*room)\b/gi,
        confidence: 0.9
      }
    ];
  }

  /**
   * Extract entities from normalized request
   */
  private extractEntities(request: string): NLPEntity[] {
    const entities: NLPEntity[] = [];

    this.entityExtractors.forEach(extractor => {
      const matches = Array.from(request.matchAll(extractor.pattern));
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          entities.push({
            type: extractor.type,
            value: match[0].toLowerCase().trim(),
            confidence: extractor.confidence,
            position: [match.index, match.index + match[0].length]
          });
        }
      });
    });

    // Remove duplicate entities and sort by confidence
    return this.deduplicateEntities(entities)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Pattern matching for intent detection
   */
  private matchPatterns(request: string, entities: NLPEntity[]): { intent: BulkOperationIntent; confidence: number } {
    let bestMatch = { 
      intent: { type: 'modify' as const, scope: 'selected' as const, target: [], modifiers: {} },
      confidence: 0 
    };

    this.commandPatterns.forEach(pattern => {
      if (pattern.pattern.test(request)) {
        const confidence = this.calculatePatternConfidence(pattern, entities);
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: { ...pattern.intent },
            confidence
          };
        }
      }
    });

    // Enhance intent with entity information
    bestMatch.intent.target = this.extractTargetsFromEntities(entities);
    bestMatch.intent.modifiers = this.extractModifiersFromEntities(entities, request);

    return bestMatch;
  }

  /**
   * Calculate pattern matching confidence
   */
  private calculatePatternConfidence(pattern: CommandPattern, entities: NLPEntity[]): number {
    let confidence = pattern.confidence;
    
    // Boost confidence if we have relevant entities
    const relevantEntities = entities.filter(entity => 
      this.isEntityRelevantToIntent(entity, pattern.intent.type)
    );
    
    confidence += Math.min(0.2, relevantEntities.length * 0.05);
    
    return Math.min(1.0, confidence);
  }

  /**
   * Check if entity is relevant to intent type
   */
  private isEntityRelevantToIntent(entity: NLPEntity, intentType: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      'assign': ['member', 'chore_type', 'room'],
      'reschedule': ['time', 'chore_type'],
      'modify': ['points', 'difficulty', 'chore_type'],
      'delete': ['chore_type', 'room', 'time'],
      'create': ['chore_type', 'room', 'difficulty', 'points'],
      'optimize': ['member', 'chore_type', 'time']
    };

    return relevanceMap[intentType]?.includes(entity.type) || false;
  }

  /**
   * Extract target information from entities
   */
  private extractTargetsFromEntities(entities: NLPEntity[]): string[] {
    const targets: string[] = [];
    
    entities.forEach(entity => {
      if (['chore_type', 'room', 'member'].includes(entity.type)) {
        targets.push(entity.value);
      }
    });
    
    return [...new Set(targets)]; // Remove duplicates
  }

  /**
   * Extract modifiers from entities and request text
   */
  private extractModifiersFromEntities(entities: NLPEntity[], request: string): Record<string, any> {
    const modifiers: Record<string, any> = {};
    
    entities.forEach(entity => {
      switch (entity.type) {
        case 'points':
          modifiers.points = parseInt(entity.value.match(/\d+/)?.[0] || '0', 10);
          break;
        case 'difficulty':
          modifiers.difficulty = entity.value;
          break;
        case 'time':
          modifiers.time = entity.value;
          break;
        case 'member':
          modifiers.assignTo = entity.value;
          break;
      }
    });

    // Extract percentage changes
    const percentageMatch = request.match(/(\d+)%/);
    if (percentageMatch) {
      modifiers.percentageChange = parseInt(percentageMatch[1], 10);
    }

    // Detect increase/decrease intent
    if (/increase|raise|add|boost/i.test(request)) {
      modifiers.operation = 'increase';
    } else if (/decrease|reduce|lower|cut/i.test(request)) {
      modifiers.operation = 'decrease';
    }

    return modifiers;
  }

  /**
   * Detect ambiguities in the request
   */
  private detectAmbiguities(request: string, entities: NLPEntity[], intent: BulkOperationIntent): string[] {
    const ambiguities: string[] = [];

    // Check for missing targets when required
    if (['assign', 'modify', 'delete'].includes(intent.type) && intent.target.length === 0) {
      ambiguities.push('unclear_target');
    }

    // Check for missing member assignment
    if (intent.type === 'assign' && !entities.some(e => e.type === 'member')) {
      ambiguities.push('unclear_member');
    }

    // Check for missing time information for scheduling
    if (intent.type === 'reschedule' && !entities.some(e => e.type === 'time')) {
      ambiguities.push('unclear_time');
    }

    // Check for vague scope indicators
    if (/all|everything|entire|whole/i.test(request) && /some|few|several/i.test(request)) {
      ambiguities.push('unclear_scope');
    }

    // Check for conflicting operations
    const operationWords = request.match(/(assign|move|change|delete|create|increase|decrease)/gi) || [];
    if (operationWords.length > 2) {
      ambiguities.push('unclear_operation');
    }

    return ambiguities;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    intent: BulkOperationIntent, 
    entities: NLPEntity[], 
    ambiguities: string[]
  ): number {
    let confidence = 0.7; // Base confidence

    // Boost for high-confidence entities
    const avgEntityConfidence = entities.length > 0 
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length 
      : 0.5;
    confidence += (avgEntityConfidence - 0.5) * 0.3;

    // Penalty for ambiguities
    confidence -= ambiguities.length * 0.15;

    // Boost for complete intent information
    if (intent.target.length > 0) confidence += 0.1;
    if (Object.keys(intent.modifiers).length > 0) confidence += 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate operation structure from parsed intent
   */
  private async generateOperationStructure(
    intent: BulkOperationIntent,
    entities: NLPEntity[],
    familyId: string,
    context: AIRequestContext
  ): Promise<Partial<EnhancedBulkOperation>> {
    const operation: Partial<EnhancedBulkOperation> = {
      operation: this.mapIntentToOperation(intent.type),
      familyId,
      aiAssisted: true,
      requiresApproval: this.requiresApproval(intent),
      operationSteps: [],
      estimatedDuration: 30, // Default estimate
      confidenceScore: this.calculateConfidence(intent, entities, [])
    };

    // Add specific modifications based on intent
    switch (intent.type) {
      case 'assign':
        operation.modifications = {
          assignTo: intent.modifiers.assignTo || entities.find(e => e.type === 'member')?.value
        };
        break;
        
      case 'reschedule':
        operation.modifications = {
          newDueDate: this.parseTimeReference(intent.modifiers.time || entities.find(e => e.type === 'time')?.value)
        };
        break;
        
      case 'modify':
        operation.modifications = this.buildModifications(intent.modifiers, entities);
        break;
    }

    return operation;
  }

  /**
   * Utility methods
   */
  private normalizeRequest(request: string): string {
    return request
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private deduplicateEntities(entities: NLPEntity[]): NLPEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.type}-${entity.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private mapIntentToOperation(intentType: string): any {
    const mapping: Record<string, any> = {
      'assign': 'assign_multiple',
      'reschedule': 'reschedule_multiple',
      'modify': 'modify_multiple',
      'delete': 'delete_multiple',
      'create': 'create_multiple',
      'optimize': 'modify_multiple'
    };
    
    return mapping[intentType] || 'modify_multiple';
  }

  private requiresApproval(intent: BulkOperationIntent): boolean {
    // High-impact operations require approval
    return ['delete', 'optimize'].includes(intent.type) || 
           intent.scope === 'all' ||
           intent.target.length > 10;
  }

  private parseTimeReference(timeRef?: string): string {
    if (!timeRef) return new Date().toISOString();
    
    const now = new Date();
    const timeMap: Record<string, number> = {
      'today': 0,
      'tomorrow': 1,
      'monday': this.getDaysUntilWeekday(1),
      'tuesday': this.getDaysUntilWeekday(2),
      'wednesday': this.getDaysUntilWeekday(3),
      'thursday': this.getDaysUntilWeekday(4),
      'friday': this.getDaysUntilWeekday(5),
      'saturday': this.getDaysUntilWeekday(6),
      'sunday': this.getDaysUntilWeekday(0),
      'weekend': this.getDaysUntilWeekday(6) // Next Saturday
    };
    
    const daysOffset = timeMap[timeRef.toLowerCase()] ?? 1;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysOffset);
    
    return targetDate.toISOString();
  }

  private getDaysUntilWeekday(targetDay: number): number {
    const today = new Date().getDay();
    const daysUntil = (targetDay - today + 7) % 7;
    return daysUntil === 0 ? 7 : daysUntil; // If it's the same day, schedule for next week
  }

  private buildModifications(modifiers: Record<string, any>, entities: NLPEntity[]): Record<string, any> {
    const modifications: Record<string, any> = {};
    
    if (modifiers.points) {
      modifications.points = modifiers.points;
    }
    
    if (modifiers.difficulty) {
      modifications.difficulty = modifiers.difficulty;
    }
    
    if (modifiers.percentageChange && modifiers.operation) {
      modifications.pointsMultiplier = modifiers.operation === 'increase' 
        ? 1 + (modifiers.percentageChange / 100)
        : 1 - (modifiers.percentageChange / 100);
    }
    
    return modifications;
  }

  private parseAIIntent(aiIntentData: any): BulkOperationIntent {
    // Parse AI response into structured intent
    return {
      type: aiIntentData.type || 'modify',
      scope: aiIntentData.scope || 'selected',
      target: aiIntentData.target || [],
      modifiers: aiIntentData.modifiers || {}
    };
  }

  private createErrorResult(request: string): NLPParseResult {
    return {
      intent: { type: 'modify', scope: 'selected', target: [], modifiers: {} },
      entities: [],
      confidence: 0.1,
      ambiguities: ['unclear_operation'],
      clarificationNeeded: true,
      suggestedOperation: {}
    };
  }
}

// Supporting interfaces
interface CommandPattern {
  pattern: RegExp;
  intent: BulkOperationIntent;
  confidence: number;
  examples: string[];
}

interface EntityExtractor {
  type: string;
  pattern: RegExp;
  confidence: number;
}

// Export singleton instance
export const naturalLanguageProcessor = new NaturalLanguageProcessor();