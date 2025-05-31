import { 
  User, 
  UserAvatar, 
  UserIdentity, 
  UserQuestionnaire, 
  BirthdayCountdown,
  VisibilityLevel,
  EnhancedFamilyMember
} from '../types';
import { avatarService } from './avatarService';
import { birthdayService } from './birthdayService';
import { identityService } from './identityService';
import { questionnaireService } from './questionnaireService';

// Profile service for managing enhanced user profiles
export class ProfileService {
  private static instance: ProfileService;

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // ====== PROFILE CREATION & UPDATES ======

  /**
   * Create enhanced user profile
   */
  async createEnhancedProfile(userData: {
    baseUser: Partial<User>;
    birthday?: string;
    identity?: {
      primaryIdentity: string;
      customIdentity?: string;
    };
    pronouns?: string;
    avatar?: {
      type: 'generated' | 'uploaded';
      config: any;
    };
    privacySettings?: {
      birthday?: VisibilityLevel;
      identity?: VisibilityLevel;
      avatar?: VisibilityLevel;
    };
  }): Promise<Partial<User>> {
    const profile: Partial<User> = { ...userData.baseUser };

    // Process birthday
    if (userData.birthday) {
      const validation = birthdayService.validateBirthday(userData.birthday);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      profile.birthday = userData.birthday;
      profile.age = birthdayService.calculateAge(userData.birthday);
      profile.birthdayCountdown = birthdayService.calculateBirthdayCountdown(userData.birthday);
    }

    // Process identity
    if (userData.identity) {
      const ageCategory = userData.birthday 
        ? birthdayService.getAgeCategoryFromBirthday(userData.birthday)
        : 'adult';

      profile.identity = identityService.createIdentity(
        userData.identity.primaryIdentity as any,
        userData.identity.customIdentity,
        ageCategory
      );

      const identityValidation = identityService.validateIdentity(profile.identity);
      if (!identityValidation.valid) {
        throw new Error(identityValidation.error);
      }
    }

    // Process pronouns
    if (userData.pronouns) {
      const pronounValidation = identityService.validatePronouns(userData.pronouns);
      if (!pronounValidation.valid) {
        throw new Error(pronounValidation.error);
      }
      profile.pronouns = pronounValidation.formatted;
    }

    // Process avatar
    if (userData.avatar) {
      try {
        profile.avatar = await avatarService.createAvatar(userData.avatar.config);
      } catch (error) {
        console.error('Failed to create avatar:', error);
        // Continue without avatar rather than failing the entire profile creation
      }
    }

    // Set privacy defaults
    profile.birthdayVisibility = userData.privacySettings?.birthday || 'family';
    profile.identityVisibility = userData.privacySettings?.identity || 'family';
    profile.avatarVisibility = userData.privacySettings?.avatar || 'family';
    profile.questionnaireVisibility = 'admins'; // Default to admins only

    // Initialize questionnaire unlock status
    if (profile.level && profile.level >= 2) {
      profile.questionnaireUnlocked = true;
    }

    return profile;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<{
      birthday: string;
      identity: UserIdentity;
      pronouns: string;
      avatar: UserAvatar;
      privacySettings: {
        birthday?: VisibilityLevel;
        identity?: VisibilityLevel;
        avatar?: VisibilityLevel;
        questionnaire?: VisibilityLevel;
      };
    }>
  ): Promise<Partial<User>> {
    const profileUpdates: Partial<User> = {};

    // Update birthday
    if (updates.birthday) {
      const validation = birthdayService.validateBirthday(updates.birthday);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      profileUpdates.birthday = updates.birthday;
      profileUpdates.age = birthdayService.calculateAge(updates.birthday);
      profileUpdates.birthdayCountdown = birthdayService.calculateBirthdayCountdown(updates.birthday);

      // Update age category in identity if it exists
      if (updates.identity) {
        updates.identity.ageCategory = birthdayService.getAgeCategoryFromBirthday(updates.birthday);
      }
    }

    // Update identity
    if (updates.identity) {
      const validation = identityService.validateIdentity(updates.identity);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      profileUpdates.identity = updates.identity;
    }

    // Update pronouns
    if (updates.pronouns) {
      const validation = identityService.validatePronouns(updates.pronouns);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      profileUpdates.pronouns = validation.formatted;
    }

    // Update avatar
    if (updates.avatar) {
      profileUpdates.avatar = updates.avatar;
    }

    // Update privacy settings
    if (updates.privacySettings) {
      if (updates.privacySettings.birthday) {
        profileUpdates.birthdayVisibility = updates.privacySettings.birthday;
      }
      if (updates.privacySettings.identity) {
        profileUpdates.identityVisibility = updates.privacySettings.identity;
      }
      if (updates.privacySettings.avatar) {
        profileUpdates.avatarVisibility = updates.privacySettings.avatar;
      }
      if (updates.privacySettings.questionnaire) {
        profileUpdates.questionnaireVisibility = updates.privacySettings.questionnaire;
      }
    }

    profileUpdates.updatedAt = new Date().toISOString();

    return profileUpdates;
  }

  // ====== QUESTIONNAIRE MANAGEMENT ======

  /**
   * Unlock questionnaire for user
   */
  unlockQuestionnaire(user: User, adminOverride: boolean = false): { unlocked: boolean; reason?: string } {
    if (user.questionnaireUnlocked) {
      return { unlocked: true };
    }

    if (questionnaireService.isEligibleForQuestionnaire(user.level || 0, adminOverride)) {
      return { unlocked: true };
    }

    return { 
      unlocked: false, 
      reason: `Level 2 required (currently level ${user.level || 0})` 
    };
  }

  /**
   * Complete questionnaire
   */
  async completeQuestionnaire(
    userId: string,
    responses: Array<{ questionId: string; answer: string | number | string[] }>,
    ageCategory: 'child' | 'teen' | 'adult'
  ): Promise<{ questionnaire: UserQuestionnaire; xpReward: number }> {
    // Get questions for validation
    const questions = questionnaireService.getQuestionsForAge(ageCategory);
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Validate all responses
    const validatedResponses: any[] = [];
    for (const response of responses) {
      const question = questionMap.get(response.questionId);
      if (!question) {
        throw new Error(`Invalid question ID: ${response.questionId}`);
      }

      const validation = questionnaireService.validateResponse(question, response.answer);
      if (!validation.valid) {
        throw new Error(`Invalid response for "${question.questionText}": ${validation.error}`);
      }

      validatedResponses.push({
        questionId: response.questionId,
        questionText: question.questionText,
        answer: response.answer,
        category: question.category
      });
    }

    // Process questionnaire
    const questionnaire = questionnaireService.processQuestionnaire(validatedResponses);

    // Calculate XP reward (base 100-200 XP for completion)
    const baseXP = 150;
    const bonusXP = Math.floor(validatedResponses.length * 5); // 5 XP per question
    const xpReward = baseXP + bonusXP;

    return { questionnaire, xpReward };
  }

  // ====== PROFILE DISPLAY & PRIVACY ======

  /**
   * Get user profile for display (respecting privacy settings)
   */
  getDisplayProfile(
    user: User, 
    viewerRole: 'admin' | 'member',
    isOwner: boolean = false
  ): Partial<User> {
    const displayProfile: Partial<User> = {
      uid: user.uid,
      displayName: user.displayName,
      level: user.level,
      achievements: user.achievements,
      badges: user.badges
    };

    // Avatar (respects privacy)
    if (identityService.canViewInformation(user.avatarVisibility || 'family', viewerRole, isOwner)) {
      displayProfile.avatar = user.avatar;
      displayProfile.photoURL = avatarService.getAvatarUrl(user.avatar);
    } else {
      // Show default avatar
      displayProfile.photoURL = avatarService.getAvatarUrl(null);
    }

    // Birthday information (respects privacy)
    if (identityService.canViewInformation(user.birthdayVisibility || 'family', viewerRole, isOwner)) {
      displayProfile.birthday = user.birthday;
      displayProfile.age = user.age;
      displayProfile.birthdayCountdown = user.birthdayCountdown;
    }

    // Identity information (respects privacy)
    if (identityService.canViewInformation(user.identityVisibility || 'family', viewerRole, isOwner)) {
      displayProfile.identity = user.identity;
      displayProfile.pronouns = user.pronouns;
    }

    // Questionnaire information (respects privacy)
    if (identityService.canViewInformation(user.questionnaireVisibility || 'admins', viewerRole, isOwner)) {
      displayProfile.questionnaire = user.questionnaire;
      displayProfile.questionnaireCompletedAt = user.questionnaireCompletedAt;
    }

    // Always show questionnaire unlock status to owner
    if (isOwner) {
      displayProfile.questionnaireUnlocked = user.questionnaireUnlocked;
    }

    return displayProfile;
  }

  /**
   * Convert User to EnhancedFamilyMember for family display
   */
  convertToEnhancedFamilyMember(user: User, viewerRole: 'admin' | 'member'): EnhancedFamilyMember {
    const displayProfile = this.getDisplayProfile(user, viewerRole);

    return {
      uid: user.uid,
      name: user.displayName || 'Unknown',
      email: user.email,
      role: user.role || 'member',
      familyRole: user.familyRole || 'other',
      points: user.points || { current: 0, lifetime: 0, weekly: 0 },
      streak: user.streak,
      streaks: user.streaks,
      level: user.level,
      xp: user.xp,
      achievements: user.achievements,
      badges: user.badges,
      photoURL: displayProfile.photoURL,
      joinedAt: user.createdAt,
      isActive: true,
      
      // Enhanced profile features
      birthday: displayProfile.birthday,
      birthdayCountdown: displayProfile.birthdayCountdown,
      age: displayProfile.age,
      identity: displayProfile.identity,
      pronouns: displayProfile.pronouns,
      avatar: displayProfile.avatar,
      questionnaire: displayProfile.questionnaire,
      questionnaireUnlocked: displayProfile.questionnaireUnlocked,
      questionnaireCompletedAt: displayProfile.questionnaireCompletedAt,
      
      // Privacy settings (only visible to admins and self)
      birthdayVisibility: viewerRole === 'admin' ? user.birthdayVisibility : undefined,
      identityVisibility: viewerRole === 'admin' ? user.identityVisibility : undefined,
      avatarVisibility: viewerRole === 'admin' ? user.avatarVisibility : undefined,
      questionnaireVisibility: viewerRole === 'admin' ? user.questionnaireVisibility : undefined
    };
  }

  // ====== BIRTHDAY MANAGEMENT ======

  /**
   * Update birthday countdown for user
   */
  updateBirthdayCountdown(user: User): BirthdayCountdown | null {
    if (!user.birthday) return null;
    
    return birthdayService.calculateBirthdayCountdown(user.birthday);
  }

  /**
   * Get family birthday calendar
   */
  getFamilyBirthdayCalendar(
    familyMembers: User[],
    viewerRole: 'admin' | 'member'
  ): Array<{
    userId: string;
    name: string;
    birthday: string;
    countdown: BirthdayCountdown;
    isVisible: boolean;
  }> {
    return familyMembers
      .map(member => {
        const canViewBirthday = identityService.canViewInformation(
          member.birthdayVisibility || 'family',
          viewerRole,
          false
        );

        if (!canViewBirthday || !member.birthday) {
          return null;
        }

        return {
          userId: member.uid,
          name: member.displayName || 'Unknown',
          birthday: member.birthday,
          countdown: birthdayService.calculateBirthdayCountdown(member.birthday),
          isVisible: true
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.countdown.daysUntil - b!.countdown.daysUntil) as any[];
  }

  // ====== PROFILE ANALYTICS ======

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(user: User): {
    percentage: number;
    completedSections: string[];
    missingSections: string[];
  } {
    const sections = [
      { name: 'Basic Info', completed: !!(user.displayName && user.email) },
      { name: 'Birthday', completed: !!user.birthday },
      { name: 'Identity', completed: !!user.identity },
      { name: 'Avatar', completed: !!user.avatar },
      { name: 'Questionnaire', completed: !!user.questionnaire }
    ];

    const completedSections = sections.filter(s => s.completed).map(s => s.name);
    const missingSections = sections.filter(s => !s.completed).map(s => s.name);
    const percentage = Math.round((completedSections.length / sections.length) * 100);

    return {
      percentage,
      completedSections,
      missingSections
    };
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(user: User): Array<{
    type: 'reward' | 'chore' | 'activity';
    title: string;
    description: string;
    reason: string;
  }> {
    const recommendations: Array<{
      type: 'reward' | 'chore' | 'activity';
      title: string;
      description: string;
      reason: string;
    }> = [];

    if (!user.questionnaire?.preferences) {
      return recommendations;
    }

    const preferences = user.questionnaire.preferences;

    // Reward recommendations based on preferences
    if (preferences.preferredRewardTypes.includes('treats')) {
      recommendations.push({
        type: 'reward',
        title: 'Sweet Treats',
        description: 'Ice cream or favorite candy',
        reason: 'Based on your preference for treats'
      });
    }

    if (preferences.preferredRewardTypes.includes('activities')) {
      recommendations.push({
        type: 'activity',
        title: 'Family Activity',
        description: 'Movie night or outdoor adventure',
        reason: 'Based on your love for family activities'
      });
    }

    // Chore recommendations based on collaboration preference
    if (preferences.collaborationPreference === 'solo') {
      recommendations.push({
        type: 'chore',
        title: 'Independent Tasks',
        description: 'Room cleaning or organizing projects',
        reason: 'You work best independently'
      });
    }

    if (preferences.collaborationPreference === 'group') {
      recommendations.push({
        type: 'chore',
        title: 'Team Projects',
        description: 'Family cleaning or cooking together',
        reason: 'You enjoy working with others'
      });
    }

    return recommendations;
  }

  // ====== UTILITY METHODS ======

  /**
   * Generate profile summary for admin view
   */
  generateProfileSummary(user: User): {
    basicInfo: Record<string, any>;
    preferences: Record<string, any>;
    insights: string[];
  } {
    const basicInfo: Record<string, any> = {
      name: user.displayName,
      age: user.age,
      level: user.level,
      joinedAt: user.createdAt
    };

    if (user.identity) {
      basicInfo.identity = identityService.getIdentityDisplayName(user.identity);
    }

    if (user.birthday) {
      basicInfo.nextBirthday = birthdayService.formatBirthdayDisplay(user.birthday, 'relative');
    }

    const preferences: Record<string, any> = {};
    const insights: string[] = [];

    if (user.questionnaire) {
      if (user.questionnaire.personalityProfile) {
        preferences.motivationStyle = user.questionnaire.personalityProfile.motivationStyle;
        preferences.learningStyle = user.questionnaire.personalityProfile.learningStyle;
        preferences.communicationStyle = user.questionnaire.personalityProfile.communicationStyle;
      }

      if (user.questionnaire.preferences) {
        preferences.collaborationPreference = user.questionnaire.preferences.collaborationPreference;
        preferences.challengeLevel = user.questionnaire.preferences.challengeLevel;
        preferences.favoriteActivities = user.questionnaire.preferences.favoriteActivities;
      }

      // Generate insights
      const generatedInsights = questionnaireService.generateInsights(user.questionnaire);
      insights.push(...generatedInsights.map(insight => insight.insight));
    }

    return { basicInfo, preferences, insights };
  }
}

export const profileService = ProfileService.getInstance();