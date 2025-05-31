import { 
  QuestionnaireQuestion, 
  QuestionnaireResponse, 
  UserQuestionnaire, 
  PersonalityProfile, 
  UserPreferencesProfile,
  QuestionCategory,
  AgeGroupQuestionnaire 
} from '../types';

// Questionnaire service for managing age-appropriate personality assessment
export class QuestionnaireService {
  private static instance: QuestionnaireService;
  private questionBank: QuestionnaireQuestion[] = [];

  static getInstance(): QuestionnaireService {
    if (!QuestionnaireService.instance) {
      QuestionnaireService.instance = new QuestionnaireService();
      QuestionnaireService.instance.initializeQuestionBank();
    }
    return QuestionnaireService.instance;
  }

  // ====== QUESTION BANK INITIALIZATION ======

  private initializeQuestionBank(): void {
    this.questionBank = [
      // Interests & Hobbies
      {
        id: 'interests_1',
        category: 'interests',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'What activities do you enjoy most?',
        answerType: 'multiSelect',
        options: ['Reading', 'Sports', 'Art & Crafts', 'Music', 'Video Games', 'Outdoor Activities', 'Cooking', 'Building/Making Things'],
        required: true,
        order: 1
      },
      
      // Learning Style
      {
        id: 'learning_1',
        category: 'learning_style',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'How do you learn best?',
        answerType: 'multipleChoice',
        options: ['Seeing pictures and diagrams', 'Listening to explanations', 'Doing it with my hands', 'A mix of all three'],
        required: true,
        order: 2
      },
      
      // Motivation
      {
        id: 'motivation_1',
        category: 'motivation',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'What motivates you most?',
        answerType: 'multipleChoice',
        options: ['Praise and recognition', 'Friendly competition', 'Helping others', 'Personal achievement', 'Rewards and treats'],
        required: true,
        order: 3
      },
      
      // Communication
      {
        id: 'communication_1',
        category: 'communication',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'How do you like to receive feedback?',
        answerType: 'multipleChoice',
        options: ['Right away', 'With lots of details', 'In front of everyone', 'Privately, just for me'],
        required: true,
        order: 4
      },
      
      // Family Dynamics
      {
        id: 'family_1',
        category: 'family_dynamics',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'Do you prefer to work on tasks...?',
        answerType: 'multipleChoice',
        options: ['By myself', 'With one other person', 'With the whole family', 'It depends on the task'],
        required: true,
        order: 5
      },
      
      // Goal Setting
      {
        id: 'goals_1',
        category: 'goals',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'Which feels more exciting to you?',
        answerType: 'multipleChoice',
        options: ['Getting something done today', 'Working toward a big goal over time', 'Both are equally exciting'],
        required: true,
        order: 6
      },
      
      // Personality
      {
        id: 'personality_1',
        category: 'personality',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'How do you feel about trying new things?',
        answerType: 'scale',
        scaleRange: { min: 1, max: 5, labels: ['I prefer familiar things', 'I love new adventures'] },
        required: true,
        order: 7
      },
      
      // Preferences
      {
        id: 'preferences_1',
        category: 'preferences',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'What time of day do you feel most energetic?',
        answerType: 'multipleChoice',
        options: ['Early morning', 'Late morning', 'Afternoon', 'Evening', 'It varies'],
        required: true,
        order: 8
      },
      
      // Activities
      {
        id: 'activities_1',
        category: 'activities',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'When faced with a challenge, you usually...',
        answerType: 'multipleChoice',
        options: ['Jump right in', 'Think it through first', 'Ask for help', 'Break it into smaller steps'],
        required: true,
        order: 9
      },
      
      // Values
      {
        id: 'values_1',
        category: 'values',
        ageGroups: ['child', 'teen', 'adult'],
        questionText: 'What makes you feel proudest?',
        answerType: 'multipleChoice',
        options: ['Helping someone else', 'Doing my best work', 'Learning something new', 'Making others happy', 'Achieving a goal'],
        required: true,
        order: 10
      }
    ];
  }

  // ====== QUESTIONNAIRE MANAGEMENT ======

  /**
   * Get age-appropriate questions for a user
   */
  getQuestionsForAge(ageCategory: AgeGroupQuestionnaire): QuestionnaireQuestion[] {
    return this.questionBank
      .filter(question => question.ageGroups.includes(ageCategory))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get all available question categories
   */
  getQuestionCategories(): Array<{
    id: QuestionCategory;
    name: string;
    description: string;
    icon: string;
  }> {
    return [
      { id: 'interests', name: 'Interests & Hobbies', description: 'What you enjoy doing', icon: '🎨' },
      { id: 'learning_style', name: 'Learning Style', description: 'How you learn best', icon: '📚' },
      { id: 'motivation', name: 'Motivation', description: 'What drives you', icon: '⚡' },
      { id: 'communication', name: 'Communication', description: 'How you like feedback', icon: '💬' },
      { id: 'family_dynamics', name: 'Family Dynamics', description: 'How you work with others', icon: '👨‍👩‍👧‍👦' },
      { id: 'goals', name: 'Goal Setting', description: 'Your approach to goals', icon: '🎯' },
      { id: 'personality', name: 'Personality', description: 'Your personal traits', icon: '🌟' },
      { id: 'preferences', name: 'Preferences', description: 'Your likes and dislikes', icon: '❤️' },
      { id: 'activities', name: 'Activities', description: 'How you approach tasks', icon: '🏃‍♂️' },
      { id: 'values', name: 'Values', description: 'What matters most to you', icon: '💎' }
    ];
  }

  /**
   * Validate questionnaire response
   */
  validateResponse(question: QuestionnaireQuestion, answer: string | number | string[]): {
    valid: boolean;
    error?: string;
  } {
    if (question.required && (answer === null || answer === undefined || answer === '')) {
      return { valid: false, error: 'This question is required' };
    }

    switch (question.answerType) {
      case 'multipleChoice':
        if (typeof answer !== 'string' || !question.options?.includes(answer)) {
          return { valid: false, error: 'Please select a valid option' };
        }
        break;

      case 'multiSelect':
        if (!Array.isArray(answer) || answer.length === 0) {
          return { valid: false, error: 'Please select at least one option' };
        }
        if (!answer.every(a => question.options?.includes(a))) {
          return { valid: false, error: 'Please select only valid options' };
        }
        break;

      case 'scale':
        const num = Number(answer);
        if (isNaN(num) || !question.scaleRange) {
          return { valid: false, error: 'Please provide a valid rating' };
        }
        if (num < question.scaleRange.min || num > question.scaleRange.max) {
          return { valid: false, error: `Please rate between ${question.scaleRange.min} and ${question.scaleRange.max}` };
        }
        break;

      case 'openText':
        if (typeof answer !== 'string' || answer.trim().length < 3) {
          return { valid: false, error: 'Please provide at least 3 characters' };
        }
        break;
    }

    return { valid: true };
  }

  // ====== RESPONSE PROCESSING ======

  /**
   * Process responses and generate personality profile
   */
  processQuestionnaire(responses: QuestionnaireResponse[]): UserQuestionnaire {
    const personalityProfile = this.generatePersonalityProfile(responses);
    const preferences = this.generateUserPreferences(responses);

    return {
      responses,
      personalityProfile,
      preferences,
      completedAt: new Date().toISOString(),
      version: 1
    };
  }

  /**
   * Generate personality profile from responses
   */
  private generatePersonalityProfile(responses: QuestionnaireResponse[]): PersonalityProfile {
    const traits: Record<string, number> = {};
    
    // Analyze responses for personality traits
    responses.forEach(response => {
      switch (response.category) {
        case 'personality':
          if (typeof response.answer === 'number') {
            traits['openness'] = response.answer * 20; // Convert 1-5 scale to 0-100
          }
          break;
          
        case 'motivation':
          if (response.answer === 'Friendly competition') {
            traits['competitiveness'] = (traits['competitiveness'] || 50) + 30;
          } else if (response.answer === 'Helping others') {
            traits['cooperation'] = (traits['cooperation'] || 50) + 30;
          }
          break;
          
        case 'family_dynamics':
          if (response.answer === 'By myself') {
            traits['independence'] = (traits['independence'] || 50) + 25;
          } else if (response.answer === 'With the whole family') {
            traits['teamwork'] = (traits['teamwork'] || 50) + 25;
          }
          break;
      }
    });

    // Ensure all traits are within 0-100 range
    Object.keys(traits).forEach(key => {
      traits[key] = Math.min(100, Math.max(0, traits[key]));
    });

    // Determine motivation style
    const motivationResponse = responses.find(r => r.category === 'motivation');
    let motivationStyle: PersonalityProfile['motivationStyle'] = 'supportive';
    
    if (motivationResponse) {
      if (motivationResponse.answer === 'Friendly competition') motivationStyle = 'competitive';
      else if (motivationResponse.answer === 'Helping others') motivationStyle = 'collaborative';
      else if (motivationResponse.answer === 'Personal achievement') motivationStyle = 'independent';
    }

    // Determine communication style
    const communicationResponse = responses.find(r => r.category === 'communication');
    let communicationStyle: PersonalityProfile['communicationStyle'] = 'encouraging';
    
    if (communicationResponse) {
      if (communicationResponse.answer === 'Right away') communicationStyle = 'direct';
      else if (communicationResponse.answer === 'With lots of details') communicationStyle = 'detailed';
      else if (communicationResponse.answer === 'In front of everyone') communicationStyle = 'visual';
    }

    // Determine learning style
    const learningResponse = responses.find(r => r.category === 'learning_style');
    let learningStyle: PersonalityProfile['learningStyle'] = 'mixed';
    
    if (learningResponse) {
      if (learningResponse.answer === 'Seeing pictures and diagrams') learningStyle = 'visual';
      else if (learningResponse.answer === 'Listening to explanations') learningStyle = 'auditory';
      else if (learningResponse.answer === 'Doing it with my hands') learningStyle = 'kinesthetic';
    }

    // Determine goal orientation
    const goalsResponse = responses.find(r => r.category === 'goals');
    let goalOrientation: PersonalityProfile['goalOrientation'] = 'mixed';
    
    if (goalsResponse) {
      if (goalsResponse.answer === 'Getting something done today') goalOrientation = 'short_term';
      else if (goalsResponse.answer === 'Working toward a big goal over time') goalOrientation = 'long_term';
    }

    return {
      traits,
      motivationStyle,
      communicationStyle,
      learningStyle,
      goalOrientation
    };
  }

  /**
   * Generate user preferences from responses
   */
  private generateUserPreferences(responses: QuestionnaireResponse[]): UserPreferencesProfile {
    // Extract interests
    const interestsResponse = responses.find(r => r.category === 'interests');
    const favoriteActivities = Array.isArray(interestsResponse?.answer) 
      ? interestsResponse.answer as string[]
      : [];

    // Determine preferred reward types based on motivation
    const motivationResponse = responses.find(r => r.category === 'motivation');
    let preferredRewardTypes: string[] = ['praise'];
    
    if (motivationResponse) {
      switch (motivationResponse.answer) {
        case 'Rewards and treats':
          preferredRewardTypes = ['treats', 'items', 'privileges'];
          break;
        case 'Friendly competition':
          preferredRewardTypes = ['leaderboards', 'badges', 'achievements'];
          break;
        case 'Helping others':
          preferredRewardTypes = ['family_activities', 'praise'];
          break;
        case 'Personal achievement':
          preferredRewardTypes = ['certificates', 'personal_goals'];
          break;
      }
    }

    // Determine preferred working times
    const timeResponse = responses.find(r => r.category === 'preferences');
    const preferredWorkingTimes = timeResponse?.answer ? [timeResponse.answer as string] : ['afternoon'];

    // Determine collaboration preference
    const familyResponse = responses.find(r => r.category === 'family_dynamics');
    let collaborationPreference: UserPreferencesProfile['collaborationPreference'] = 'varies';
    
    if (familyResponse) {
      switch (familyResponse.answer) {
        case 'By myself':
          collaborationPreference = 'solo';
          break;
        case 'With one other person':
          collaborationPreference = 'partner';
          break;
        case 'With the whole family':
          collaborationPreference = 'group';
          break;
      }
    }

    // Determine challenge level preference
    const activitiesResponse = responses.find(r => r.category === 'activities');
    let challengeLevel: UserPreferencesProfile['challengeLevel'] = 'moderate';
    
    if (activitiesResponse) {
      switch (activitiesResponse.answer) {
        case 'Jump right in':
          challengeLevel = 'difficult';
          break;
        case 'Think it through first':
          challengeLevel = 'moderate';
          break;
        case 'Ask for help':
          challengeLevel = 'easy';
          break;
        case 'Break it into smaller steps':
          challengeLevel = 'moderate';
          break;
      }
    }

    // Determine feedback style
    const communicationResponse = responses.find(r => r.category === 'communication');
    let feedbackStyle: UserPreferencesProfile['feedbackStyle'] = 'immediate';
    
    if (communicationResponse) {
      switch (communicationResponse.answer) {
        case 'Right away':
          feedbackStyle = 'immediate';
          break;
        case 'With lots of details':
          feedbackStyle = 'detailed';
          break;
        case 'In front of everyone':
          feedbackStyle = 'public';
          break;
        case 'Privately, just for me':
          feedbackStyle = 'private';
          break;
      }
    }

    return {
      favoriteActivities,
      preferredRewardTypes,
      preferredWorkingTimes,
      collaborationPreference,
      challengeLevel,
      feedbackStyle
    };
  }

  // ====== INSIGHTS & RECOMMENDATIONS ======

  /**
   * Generate personalized insights from questionnaire
   */
  generateInsights(questionnaire: UserQuestionnaire): Array<{
    category: string;
    insight: string;
    actionable: boolean;
    recommendations?: string[];
  }> {
    const insights: Array<{
      category: string;
      insight: string;
      actionable: boolean;
      recommendations?: string[];
    }> = [];

    if (!questionnaire.personalityProfile || !questionnaire.preferences) {
      return insights;
    }

    const { personalityProfile, preferences } = questionnaire;

    // Learning style insights
    insights.push({
      category: 'Learning',
      insight: `You learn best through ${personalityProfile.learningStyle} approaches`,
      actionable: true,
      recommendations: this.getLearningRecommendations(personalityProfile.learningStyle)
    });

    // Motivation insights
    insights.push({
      category: 'Motivation',
      insight: `Your motivation style is ${personalityProfile.motivationStyle}`,
      actionable: true,
      recommendations: this.getMotivationRecommendations(personalityProfile.motivationStyle)
    });

    // Collaboration insights
    insights.push({
      category: 'Collaboration',
      insight: `You prefer ${preferences.collaborationPreference} work environments`,
      actionable: true,
      recommendations: this.getCollaborationRecommendations(preferences.collaborationPreference)
    });

    // Challenge level insights
    insights.push({
      category: 'Challenge',
      insight: `You work best with ${preferences.challengeLevel} difficulty tasks`,
      actionable: true,
      recommendations: this.getChallengeRecommendations(preferences.challengeLevel)
    });

    return insights;
  }

  private getLearningRecommendations(learningStyle: string): string[] {
    const recommendations: Record<string, string[]> = {
      visual: ['Use pictures and diagrams', 'Create checklists with icons', 'Use colorful labels'],
      auditory: ['Listen to instructions carefully', 'Talk through steps', 'Use verbal reminders'],
      kinesthetic: ['Learn by doing', 'Break into physical steps', 'Use hands-on practice'],
      mixed: ['Combine visual, auditory, and hands-on learning', 'Experiment with different approaches']
    };
    
    return recommendations[learningStyle] || recommendations.mixed;
  }

  private getMotivationRecommendations(motivationStyle: string): string[] {
    const recommendations: Record<string, string[]> = {
      competitive: ['Join friendly competitions', 'Track progress against others', 'Celebrate wins'],
      collaborative: ['Work on team projects', 'Help family members', 'Share achievements'],
      independent: ['Set personal goals', 'Track individual progress', 'Celebrate personal milestones'],
      supportive: ['Focus on encouragement', 'Value effort over results', 'Build confidence']
    };
    
    return recommendations[motivationStyle] || recommendations.supportive;
  }

  private getCollaborationRecommendations(collaborationStyle: string): string[] {
    const recommendations: Record<string, string[]> = {
      solo: ['Take on independent tasks', 'Have quiet work time', 'Set individual goals'],
      partner: ['Work with a buddy', 'Share responsibilities', 'Collaborate in pairs'],
      group: ['Join family projects', 'Participate in group activities', 'Lead team efforts'],
      varies: ['Mix solo and group work', 'Choose based on the task', 'Be flexible']
    };
    
    return recommendations[collaborationStyle] || recommendations.varies;
  }

  private getChallengeRecommendations(challengeLevel: string): string[] {
    const recommendations: Record<string, string[]> = {
      easy: ['Start with simple tasks', 'Build confidence gradually', 'Celebrate small wins'],
      moderate: ['Balance easy and challenging tasks', 'Break big tasks into steps', 'Ask for help when needed'],
      difficult: ['Take on complex challenges', 'Push your limits', 'Learn from mistakes'],
      mixed: ['Vary task difficulty', 'Progress gradually', 'Mix challenge levels']
    };
    
    return recommendations[challengeLevel] || recommendations.mixed;
  }

  // ====== UTILITY METHODS ======

  /**
   * Check if user is eligible for questionnaire
   */
  isEligibleForQuestionnaire(userLevel: number, adminOverride: boolean = false): boolean {
    return userLevel >= 2 || adminOverride;
  }

  /**
   * Get questionnaire progress
   */
  getQuestionnaireProgress(responses: QuestionnaireResponse[], ageCategory: AgeGroupQuestionnaire): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const totalQuestions = this.getQuestionsForAge(ageCategory).length;
    const completedQuestions = responses.length;
    
    return {
      completed: completedQuestions,
      total: totalQuestions,
      percentage: Math.round((completedQuestions / totalQuestions) * 100)
    };
  }

  /**
   * Get next question to answer
   */
  getNextQuestion(responses: QuestionnaireResponse[], ageCategory: AgeGroupQuestionnaire): QuestionnaireQuestion | null {
    const allQuestions = this.getQuestionsForAge(ageCategory);
    const answeredQuestionIds = responses.map(r => r.questionId);
    
    return allQuestions.find(q => !answeredQuestionIds.includes(q.id)) || null;
  }
}

export const questionnaireService = QuestionnaireService.getInstance();