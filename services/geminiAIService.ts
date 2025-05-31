/**
 * Google Gemini AI Service for Enhanced Bulk Operations
 * Handles secure API communication, rate limiting, and response processing
 */

import { 
  GeminiAIRequest, 
  GeminiAIResponse, 
  AIError, 
  AIUsageTracker,
  AIRequestContext,
  GeminiRequestOptions
} from '../types/ai';
import { getAIConfig, validateAIConfig, AI_PROMPTS } from '../config/aiConfiguration';
import { doc, getDoc } from 'firebase/firestore';
import { safeCollection } from '../config/firebase';

interface GeminiAPIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

class GeminiAIService {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private rateLimitTracker = new Map<string, number[]>();
  private usageTracker = new Map<string, AIUsageTracker>();
  private responseCache = new Map<string, { response: GeminiAIResponse; expiry: number }>();
  private familyConfigCache = new Map<string, { config: any; expiry: number }>();
  
  constructor() {
    // No need to initialize with global config anymore
  }

  /**
   * Get family-specific AI configuration including their API key
   */
  private async getFamilyAIConfig(familyId: string): Promise<any> {
    // Check cache first
    const cached = this.familyConfigCache.get(familyId);
    if (cached && Date.now() < cached.expiry) {
      return cached.config;
    }

    try {
      const configDoc = doc(safeCollection('familyAIConfig'), familyId);
      const configSnap = await getDoc(configDoc);
      
      const config = configSnap.exists() ? configSnap.data() : { aiEnabled: false };
      
      // Cache for 5 minutes
      this.familyConfigCache.set(familyId, {
        config,
        expiry: Date.now() + (5 * 60 * 1000)
      });
      
      return config;
    } catch (error) {
      console.error('Error loading family AI config:', error);
      return { aiEnabled: false };
    }
  }

  /**
   * Check if AI service is available for a specific family
   */
  public async isAvailable(familyId: string): Promise<boolean> {
    try {
      const config = await this.getFamilyAIConfig(familyId);
      return config.aiEnabled && config.geminiApiKey && config.geminiApiKey.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process natural language request for bulk operations
   */
  public async processNaturalLanguageRequest(
    request: string,
    familyId: string,
    context: AIRequestContext
  ): Promise<GeminiAIResponse> {
    const aiRequest: GeminiAIRequest = {
      requestId: this.generateRequestId(),
      familyId,
      requestType: 'bulk_operation',
      prompt: this.buildBulkOperationPrompt(request, context),
      context,
      options: {
        maxTokens: 2048,
        temperature: 0.3,
        topP: 0.8,
        requireStructuredOutput: true
      },
      timestamp: new Date().toISOString()
    };

    return this.makeGeminiRequest(aiRequest);
  }

  /**
   * Get AI suggestions for optimizing bulk operations
   */
  public async getSuggestions(
    operationType: string,
    familyId: string,
    context: AIRequestContext
  ): Promise<GeminiAIResponse> {
    const aiRequest: GeminiAIRequest = {
      requestId: this.generateRequestId(),
      familyId,
      requestType: 'suggestion',
      prompt: this.buildSuggestionPrompt(operationType, context),
      context,
      options: {
        maxTokens: 1536,
        temperature: 0.4,
        topP: 0.9
      },
      timestamp: new Date().toISOString()
    };

    return this.makeGeminiRequest(aiRequest);
  }

  /**
   * Analyze potential conflicts in bulk operations
   */
  public async analyzeConflicts(
    operationDetails: any,
    familyId: string,
    context: AIRequestContext
  ): Promise<GeminiAIResponse> {
    const aiRequest: GeminiAIRequest = {
      requestId: this.generateRequestId(),
      familyId,
      requestType: 'analysis',
      prompt: this.buildConflictAnalysisPrompt(operationDetails, context),
      context,
      options: {
        maxTokens: 1024,
        temperature: 0.2,
        topP: 0.7,
        requireStructuredOutput: true
      },
      timestamp: new Date().toISOString()
    };

    return this.makeGeminiRequest(aiRequest);
  }

  /**
   * Assess family impact of proposed bulk operations
   */
  public async assessFamilyImpact(
    operation: any,
    familyId: string,
    context: AIRequestContext
  ): Promise<GeminiAIResponse> {
    const aiRequest: GeminiAIRequest = {
      requestId: this.generateRequestId(),
      familyId,
      requestType: 'analysis',
      prompt: this.buildImpactAnalysisPrompt(operation, context),
      context,
      options: {
        maxTokens: 1536,
        temperature: 0.3,
        topP: 0.8
      },
      timestamp: new Date().toISOString()
    };

    return this.makeGeminiRequest(aiRequest);
  }

  /**
   * Core method to make requests to Gemini API
   */
  private async makeGeminiRequest(request: GeminiAIRequest): Promise<GeminiAIResponse> {
    // Get family's AI configuration
    const familyConfig = await this.getFamilyAIConfig(request.familyId);
    
    if (!familyConfig.aiEnabled || !familyConfig.geminiApiKey) {
      return this.createErrorResponse(request.requestId, 'API_KEY_INVALID', 'AI service not configured for this family');
    }

    // Check rate limits
    if (!this.checkRateLimit(request.familyId)) {
      return this.createErrorResponse(request.requestId, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded');
    }

    // Check cache
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Track usage
      this.trackRequest(request);

      // Prepare API request
      const apiRequest = this.prepareAPIRequest(request);
      const config = getAIConfig();
      
      // Make API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

      const response = await fetch(
        `${this.baseUrl}/gemini-1.5-flash-latest:generateContent?key=${familyConfig.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiRequest),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const apiResponse: GeminiAPIResponse = await response.json();
      
      // Process and return response
      const processedResponse = this.processAPIResponse(request.requestId, apiResponse);
      
      // Cache response
      this.cacheResponse(cacheKey, processedResponse);
      
      return processedResponse;

    } catch (error) {
      console.error('Gemini API request failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return this.createErrorResponse(request.requestId, 'REQUEST_TIMEOUT', 'Request timed out');
        }
        return this.createErrorResponse(request.requestId, 'SERVICE_UNAVAILABLE', error.message);
      }
      
      return this.createErrorResponse(request.requestId, 'SERVICE_UNAVAILABLE', 'Unknown error occurred');
    }
  }

  /**
   * Build prompts for different types of AI requests
   */
  private buildBulkOperationPrompt(request: string, context: AIRequestContext): string {
    const familyContext = this.buildFamilyContextString(context);
    const choresContext = this.buildChoresContextString(context.activeChores);

    return AI_PROMPTS.BULK_OPERATION_ANALYZER
      .replace('{familyContext}', familyContext)
      .replace('{choresContext}', choresContext)
      .replace('{userRequest}', request);
  }

  private buildSuggestionPrompt(operationType: string, context: AIRequestContext): string {
    const familyData = this.buildFamilyContextString(context);
    const completionHistory = this.buildCompletionHistoryString(context);
    const currentIssues = this.identifyCurrentIssues(context);

    return AI_PROMPTS.OPTIMIZATION_SUGGESTER
      .replace('{familyData}', familyData)
      .replace('{completionHistory}', completionHistory)
      .replace('{currentIssues}', currentIssues);
  }

  private buildConflictAnalysisPrompt(operationDetails: any, context: AIRequestContext): string {
    const operationString = JSON.stringify(operationDetails, null, 2);
    const familySchedule = this.buildScheduleContextString(context);
    const memberWorkloads = this.buildWorkloadContextString(context);

    return AI_PROMPTS.CONFLICT_DETECTOR
      .replace('{operationDetails}', operationString)
      .replace('{familySchedule}', familySchedule)
      .replace('{memberWorkloads}', memberWorkloads);
  }

  private buildImpactAnalysisPrompt(operation: any, context: AIRequestContext): string {
    const operationString = JSON.stringify(operation, null, 2);
    const currentState = this.buildCurrentStateString(context);
    const proposedChanges = this.buildProposedChangesString(operation);

    return AI_PROMPTS.IMPACT_ANALYZER
      .replace('{operation}', operationString)
      .replace('{currentState}', currentState)
      .replace('{proposedChanges}', proposedChanges);
  }

  /**
   * Helper methods for building context strings
   */
  private buildFamilyContextString(context: AIRequestContext): string {
    return `Family Size: ${context.familySize}
Member Ages: ${context.memberAges.join(', ')}
Active Chores: ${context.activeChores.length}
Preferences: ${JSON.stringify(context.familyPreferences, null, 2)}`;
  }

  private buildChoresContextString(chores: any[]): string {
    return chores.map((chore, index) => 
      `${index + 1}. ${chore.title} (${chore.difficulty}, ${chore.points} pts, assigned to: ${chore.assignedTo})`
    ).join('\n');
  }

  private buildScheduleContextString(context: AIRequestContext): string {
    if (!context.currentSchedule) return 'No schedule data available';
    
    return JSON.stringify(context.currentSchedule, null, 2);
  }

  private buildWorkloadContextString(context: AIRequestContext): string {
    // Build workload summary from active chores
    const workloadMap = new Map<string, { chores: number; points: number }>();
    
    context.activeChores.forEach(chore => {
      const existing = workloadMap.get(chore.assignedTo) || { chores: 0, points: 0 };
      existing.chores += 1;
      existing.points += chore.points;
      workloadMap.set(chore.assignedTo, existing);
    });

    return Array.from(workloadMap.entries())
      .map(([memberId, workload]) => `${memberId}: ${workload.chores} chores, ${workload.points} points`)
      .join('\n');
  }

  private buildCurrentStateString(context: AIRequestContext): string {
    return `Current Family State:
- ${context.familySize} family members
- ${context.activeChores.length} active chores
- Member ages: ${context.memberAges.join(', ')}`;
  }

  private buildProposedChangesString(operation: any): string {
    return `Proposed Operation: ${JSON.stringify(operation, null, 2)}`;
  }

  private buildCompletionHistoryString(context: AIRequestContext): string {
    if (!context.historicalPatterns?.completionPatterns) {
      return 'No completion history available';
    }
    
    return context.historicalPatterns.completionPatterns
      .map(pattern => `${pattern.memberId}: ${pattern.choreType} - ${Math.round(pattern.completionRate * 100)}% completion rate`)
      .join('\n');
  }

  private identifyCurrentIssues(context: AIRequestContext): string {
    const issues: string[] = [];
    
    // Analyze workload imbalances
    const workloadMap = new Map<string, number>();
    context.activeChores.forEach(chore => {
      workloadMap.set(chore.assignedTo, (workloadMap.get(chore.assignedTo) || 0) + chore.points);
    });
    
    const workloads = Array.from(workloadMap.values());
    if (workloads.length > 1) {
      const max = Math.max(...workloads);
      const min = Math.min(...workloads);
      if (max - min > 50) {
        issues.push('Significant workload imbalance detected');
      }
    }
    
    // Check for overdue chores
    const now = new Date();
    const overdueCount = context.activeChores.filter(chore => 
      new Date(chore.dueDate) < now
    ).length;
    
    if (overdueCount > 0) {
      issues.push(`${overdueCount} overdue chores`);
    }
    
    return issues.length > 0 ? issues.join('\n') : 'No significant issues identified';
  }

  /**
   * API request preparation and response processing
   */
  private prepareAPIRequest(request: GeminiAIRequest): any {
    return {
      contents: [{
        parts: [{
          text: request.prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: request.options.maxTokens || 1024,
        temperature: request.options.temperature || 0.3,
        topP: request.options.topP || 0.8,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };
  }

  private processAPIResponse(requestId: string, apiResponse: GeminiAPIResponse): GeminiAIResponse {
    const candidate = apiResponse.candidates?.[0];
    
    if (!candidate) {
      return this.createErrorResponse(requestId, 'SERVICE_UNAVAILABLE', 'No response from API');
    }

    const responseText = candidate.content?.parts?.[0]?.text || '';
    
    try {
      // Try to parse as JSON if structured output was requested
      let parsedResponse: any = {};
      if (responseText.trim().startsWith('{')) {
        parsedResponse = JSON.parse(responseText);
      }

      return {
        requestId,
        success: true,
        confidence: this.calculateConfidence(candidate),
        reasoning: parsedResponse.reasoning || responseText,
        suggestions: parsedResponse.suggestions || [],
        analysis: parsedResponse.analysis,
        bulkOperation: parsedResponse.bulkOperation,
        usage: {
          inputTokens: apiResponse.usageMetadata?.promptTokenCount || 0,
          outputTokens: apiResponse.usageMetadata?.candidatesTokenCount || 0,
          requestDuration: 0 // Will be set by caller
        }
      };
    } catch (parseError) {
      // If JSON parsing fails, return text response
      return {
        requestId,
        success: true,
        confidence: 0.7,
        reasoning: responseText,
        usage: {
          inputTokens: apiResponse.usageMetadata?.promptTokenCount || 0,
          outputTokens: apiResponse.usageMetadata?.candidatesTokenCount || 0,
          requestDuration: 0
        }
      };
    }
  }

  private calculateConfidence(candidate: any): number {
    // Simple confidence calculation based on safety ratings and finish reason
    if (candidate.finishReason !== 'STOP') {
      return 0.3;
    }
    
    const safetyIssues = candidate.safetyRatings?.filter((rating: any) => 
      rating.probability === 'HIGH' || rating.probability === 'MEDIUM'
    ).length || 0;
    
    return Math.max(0.1, 1.0 - (safetyIssues * 0.2));
  }

  /**
   * Rate limiting and usage tracking
   */
  private checkRateLimit(familyId: string): boolean {
    const config = getAIConfig();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    const requests = this.rateLimitTracker.get(familyId) || [];
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= config.requestRateLimit) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimitTracker.set(familyId, recentRequests);
    return true;
  }

  private trackRequest(request: GeminiAIRequest): void {
    const today = new Date().toISOString().split('T')[0];
    const key = `${request.familyId}-${today}`;
    
    const tracker = this.usageTracker.get(key) || {
      familyId: request.familyId,
      date: today,
      requestCount: 0,
      requestTypes: {},
      tokenUsage: { input: 0, output: 0, total: 0 },
      costEstimate: 0,
      rateLimitHits: 0,
      lastRequest: ''
    };
    
    tracker.requestCount += 1;
    tracker.requestTypes[request.requestType] = (tracker.requestTypes[request.requestType] || 0) + 1;
    tracker.lastRequest = request.timestamp;
    
    this.usageTracker.set(key, tracker);
  }

  /**
   * Response caching
   */
  private generateCacheKey(request: GeminiAIRequest): string {
    // Create a hash of the relevant request parts for caching
    const keyData = {
      type: request.requestType,
      prompt: request.prompt.substring(0, 200), // First 200 chars
      familySize: request.context.familySize,
      choreCount: request.context.activeChores.length
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private getCachedResponse(cacheKey: string): GeminiAIResponse | null {
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.response;
    }
    
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResponse(cacheKey: string, response: GeminiAIResponse): void {
    const config = getAIConfig();
    const expiry = Date.now() + (config.performance.cacheResponsesMinutes * 60 * 1000);
    
    this.responseCache.set(cacheKey, { response, expiry });
    
    // Clean up expired entries
    if (this.responseCache.size > 100) {
      const now = Date.now();
      for (const [key, cached] of this.responseCache.entries()) {
        if (now >= cached.expiry) {
          this.responseCache.delete(key);
        }
      }
    }
  }

  /**
   * Utility methods
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createErrorResponse(requestId: string, code: string, message: string): GeminiAIResponse {
    return {
      requestId,
      success: false,
      confidence: 0,
      reasoning: `Error: ${message}`,
      errors: [message],
      usage: { inputTokens: 0, outputTokens: 0, requestDuration: 0 }
    };
  }

  /**
   * Public methods for service management
   */
  public getUsageStats(familyId: string): AIUsageTracker | null {
    const today = new Date().toISOString().split('T')[0];
    return this.usageTracker.get(`${familyId}-${today}`) || null;
  }

  public clearCache(): void {
    this.responseCache.clear();
  }

  public resetRateLimits(): void {
    this.rateLimitTracker.clear();
  }
}

// Export singleton instance
export const geminiAIService = new GeminiAIService();