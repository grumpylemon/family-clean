/**
 * AI Service Configuration for Enhanced Bulk Operations
 * Manages Google Gemini API integration settings and feature flags
 */

export interface AIConfiguration {
  // Service Settings
  enabled: boolean;
  geminiApiKey?: string;
  requestRateLimit: number; // requests per minute
  maxRequestsPerFamily: number; // daily limit
  requestTimeoutMs: number;
  
  // Feature Flags
  features: {
    naturalLanguageOperations: boolean;
    smartSuggestions: boolean;
    conflictDetection: boolean;
    impactAnalysis: boolean;
    optimizationRecommendations: boolean;
    seasonalAdjustments: boolean;
  };
  
  // Privacy & Security
  privacy: {
    maxDataSharingLevel: 'basic' | 'standard' | 'detailed';
    allowFamilyContextSharing: boolean;
    logRequests: boolean;
    retentionDays: number;
  };
  
  // Performance Settings
  performance: {
    cacheResponsesMinutes: number;
    enableRequestBatching: boolean;
    maxConcurrentRequests: number;
  };
}

export const DEFAULT_AI_CONFIG: AIConfiguration = {
  enabled: true,
  requestRateLimit: 10, // 10 requests per minute per family
  maxRequestsPerFamily: 100, // 100 requests per day per family
  requestTimeoutMs: 30000, // 30 seconds
  
  features: {
    naturalLanguageOperations: true,
    smartSuggestions: true,
    conflictDetection: true,
    impactAnalysis: true,
    optimizationRecommendations: true,
    seasonalAdjustments: false // Phase 2 feature
  },
  
  privacy: {
    maxDataSharingLevel: 'standard',
    allowFamilyContextSharing: true,
    logRequests: true,
    retentionDays: 30
  },
  
  performance: {
    cacheResponsesMinutes: 15,
    enableRequestBatching: true,
    maxConcurrentRequests: 3
  }
};

export const AI_PROMPTS = {
  // System prompts for different operation types
  BULK_OPERATION_ANALYZER: `You are a helpful family household management assistant. Analyze the user's natural language request and convert it into structured bulk chore operations. Consider family context, fairness, and practical constraints.

Guidelines:
- Always prioritize family harmony and equitable workload distribution
- Suggest safe and appropriate chore assignments based on member ages and capabilities
- Detect potential conflicts in scheduling, workload, or resource usage
- Provide clear reasoning for your suggestions
- If the request is ambiguous, ask for clarification

Family Context: {familyContext}
Current Chores: {choresContext}
User Request: {userRequest}

Respond with a structured analysis including:
1. Interpreted operation type and parameters
2. Affected chores and family members
3. Potential conflicts or concerns
4. Recommendations for optimal execution`,

  CONFLICT_DETECTOR: `Analyze the proposed bulk chore operation for potential conflicts:

Operation Details: {operationDetails}
Family Schedule: {familySchedule}
Member Workloads: {memberWorkloads}

Identify:
1. Schedule conflicts (overlapping assignments, impossible deadlines)
2. Workload imbalances (unfair distribution among members)
3. Skill mismatches (inappropriate assignments for member capabilities)
4. Resource conflicts (multiple chores needing same space/equipment)

For each conflict, suggest specific resolution strategies.`,

  IMPACT_ANALYZER: `Assess the family impact of this bulk operation:

Operation: {operation}
Current State: {currentState}
Proposed Changes: {proposedChanges}

Analyze:
1. How each family member's workload and schedule will change
2. Overall fairness and equity impact
3. Potential positive and negative effects on family dynamics
4. Recommendations for improving the operation

Provide specific metrics and actionable insights.`,

  OPTIMIZATION_SUGGESTER: `Based on the family's chore completion patterns and preferences, suggest optimizations:

Family Data: {familyData}
Completion History: {completionHistory}
Current Issues: {currentIssues}

Suggest improvements for:
1. Better workload distribution
2. More efficient scheduling
3. Skill-appropriate assignments
4. Seasonal adjustments
5. Family satisfaction enhancement`
};

export function getAIConfig(): AIConfiguration {
  // In production, this would load from environment variables and family preferences
  const config = { ...DEFAULT_AI_CONFIG };
  
  // Load from environment variables
  config.geminiApiKey = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
  config.enabled = process.env.EXPO_PUBLIC_AI_FEATURE_ENABLED !== 'false';
  
  if (process.env.EXPO_PUBLIC_AI_REQUEST_RATE_LIMIT) {
    config.requestRateLimit = parseInt(process.env.EXPO_PUBLIC_AI_REQUEST_RATE_LIMIT, 10);
  }
  
  return config;
}

export function validateAIConfig(config: AIConfiguration): string[] {
  const errors: string[] = [];
  
  if (config.enabled && !config.geminiApiKey) {
    errors.push('Gemini API key is required when AI features are enabled');
  }
  
  if (config.requestRateLimit < 1 || config.requestRateLimit > 60) {
    errors.push('Request rate limit must be between 1 and 60 requests per minute');
  }
  
  if (config.requestTimeoutMs < 5000 || config.requestTimeoutMs > 60000) {
    errors.push('Request timeout must be between 5 and 60 seconds');
  }
  
  return errors;
}