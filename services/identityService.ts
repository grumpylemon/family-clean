import { IdentityOption, UserIdentity, VisibilityLevel } from '../types';

// Identity service for managing inclusive identity options and privacy
export class IdentityService {
  private static instance: IdentityService;

  static getInstance(): IdentityService {
    if (!IdentityService.instance) {
      IdentityService.instance = new IdentityService();
    }
    return IdentityService.instance;
  }

  // ====== IDENTITY OPTIONS ======

  /**
   * Get all available identity options with descriptions
   */
  getIdentityOptions(): Array<{
    id: IdentityOption;
    label: string;
    description?: string;
    supportsPronoun?: boolean;
  }> {
    return [
      { 
        id: 'Boy', 
        label: 'Boy', 
        description: 'Young male person',
        supportsPronoun: true
      },
      { 
        id: 'Girl', 
        label: 'Girl', 
        description: 'Young female person',
        supportsPronoun: true
      },
      { 
        id: 'Man', 
        label: 'Man', 
        description: 'Adult male person',
        supportsPronoun: true
      },
      { 
        id: 'Woman', 
        label: 'Woman', 
        description: 'Adult female person',
        supportsPronoun: true
      },
      { 
        id: 'Non Binary', 
        label: 'Non Binary', 
        description: 'Gender identity outside the binary of male/female',
        supportsPronoun: true
      },
      { 
        id: 'Genderfluid', 
        label: 'Genderfluid', 
        description: 'Gender identity that varies over time',
        supportsPronoun: true
      },
      { 
        id: 'Agender', 
        label: 'Agender', 
        description: 'Without gender or gender-neutral',
        supportsPronoun: true
      },
      { 
        id: 'Demigender', 
        label: 'Demigender', 
        description: 'Partial connection to a particular gender',
        supportsPronoun: true
      },
      { 
        id: 'Two Spirit', 
        label: 'Two Spirit', 
        description: 'Native American/Indigenous concept of gender',
        supportsPronoun: true
      },
      { 
        id: 'Questioning', 
        label: 'Questioning', 
        description: 'Exploring or uncertain about gender identity',
        supportsPronoun: true
      },
      { 
        id: 'Prefer Not to Say', 
        label: 'Prefer Not to Say', 
        description: 'Choose not to specify gender identity'
      },
      { 
        id: 'Other', 
        label: 'Other', 
        description: 'Identity not listed above',
        supportsPronoun: true
      }
    ];
  }

  /**
   * Get age-appropriate identity options
   */
  getAgeAppropriateIdentityOptions(ageCategory: 'child' | 'teen' | 'adult'): Array<{
    id: IdentityOption;
    label: string;
    description?: string;
    supportsPronoun?: boolean;
  }> {
    const allOptions = this.getIdentityOptions();
    
    switch (ageCategory) {
      case 'child':
        // Simplified options for younger children
        return allOptions.filter(option => 
          ['Boy', 'Girl', 'Other', 'Prefer Not to Say'].includes(option.id)
        );
      
      case 'teen':
        // More options for teens exploring identity
        return allOptions.filter(option => 
          !['Man', 'Woman'].includes(option.id)
        );
      
      case 'adult':
        // All options available for adults
        return allOptions;
      
      default:
        return allOptions;
    }
  }

  // ====== PRONOUN MANAGEMENT ======

  /**
   * Get common pronoun options
   */
  getCommonPronouns(): Array<{
    pronouns: string;
    example: string;
    description?: string;
  }> {
    return [
      { pronouns: 'he/him', example: 'He is completing his chore' },
      { pronouns: 'she/her', example: 'She is completing her chore' },
      { pronouns: 'they/them', example: 'They are completing their chore' },
      { pronouns: 'xe/xem', example: 'Xe is completing xer chore', description: 'Neo-pronouns' },
      { pronouns: 'ze/hir', example: 'Ze is completing hir chore', description: 'Neo-pronouns' },
      { pronouns: 'it/its', example: 'It is completing its chore' },
      { pronouns: 'fae/faer', example: 'Fae is completing faer chore', description: 'Neo-pronouns' }
    ];
  }

  /**
   * Suggest pronouns based on identity
   */
  suggestPronouns(identity: IdentityOption): string[] {
    const suggestions: Record<IdentityOption, string[]> = {
      'Boy': ['he/him'],
      'Girl': ['she/her'],
      'Man': ['he/him'],
      'Woman': ['she/her'],
      'Non Binary': ['they/them', 'xe/xem', 'ze/hir'],
      'Genderfluid': ['they/them', 'he/him', 'she/her'],
      'Agender': ['they/them', 'it/its'],
      'Demigender': ['they/them', 'he/him', 'she/her'],
      'Two Spirit': ['they/them'],
      'Questioning': ['they/them'],
      'Prefer Not to Say': [],
      'Other': ['they/them']
    };
    
    return suggestions[identity] || ['they/them'];
  }

  /**
   * Parse and validate custom pronouns
   */
  validatePronouns(pronouns: string): { valid: boolean; formatted?: string; error?: string } {
    if (!pronouns.trim()) {
      return { valid: false, error: 'Pronouns cannot be empty' };
    }

    // Clean up the input
    const cleaned = pronouns.toLowerCase().trim();
    
    // Check for common patterns
    const patterns = [
      /^(he|she|they|xe|ze|it|fae)\/(him|her|them|xem|hir|its|faer)$/,
      /^(he|she|they|xe|ze|it|fae)\/(his|her|their|xer|hir|its|faer)\/(him|her|them|xem|hir|its|faer)$/
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      return { 
        valid: false, 
        error: 'Please use format like "they/them" or "she/her/hers"' 
      };
    }
    
    return { valid: true, formatted: cleaned };
  }

  // ====== TEXT PROCESSING ======

  /**
   * Replace pronouns in text based on user's preferred pronouns
   */
  replacePronounsInText(text: string, userPronouns: string): string {
    if (!userPronouns) return text;
    
    const pronounParts = userPronouns.toLowerCase().split('/');
    if (pronounParts.length < 2) return text;
    
    const [subjective, objective, possessive] = pronounParts;
    
    // Define replacement maps for different pronoun sets
    const replacements: Record<string, { subjective: string; objective: string; possessive: string }> = {
      'they/them': { subjective: 'they', objective: 'them', possessive: 'their' },
      'he/him': { subjective: 'he', objective: 'him', possessive: 'his' },
      'she/her': { subjective: 'she', objective: 'her', possessive: 'her' },
      'xe/xem': { subjective: 'xe', objective: 'xem', possessive: 'xer' },
      'ze/hir': { subjective: 'ze', objective: 'hir', possessive: 'hir' },
      'it/its': { subjective: 'it', objective: 'it', possessive: 'its' },
      'fae/faer': { subjective: 'fae', objective: 'faer', possessive: 'faer' }
    };
    
    // Use the provided pronouns or fall back to they/them
    const pronounSet = replacements[userPronouns] || {
      subjective,
      objective,
      possessive: possessive || objective
    };
    
    let result = text;
    
    // Replace pronouns (case-insensitive with proper capitalization)
    result = result.replace(/\bthey\b/gi, (match) => 
      match[0] === match[0].toUpperCase() ? 
        pronounSet.subjective.charAt(0).toUpperCase() + pronounSet.subjective.slice(1) : 
        pronounSet.subjective
    );
    
    result = result.replace(/\bthem\b/gi, (match) => 
      match[0] === match[0].toUpperCase() ? 
        pronounSet.objective.charAt(0).toUpperCase() + pronounSet.objective.slice(1) : 
        pronounSet.objective
    );
    
    result = result.replace(/\btheir\b/gi, (match) => 
      match[0] === match[0].toUpperCase() ? 
        pronounSet.possessive.charAt(0).toUpperCase() + pronounSet.possessive.slice(1) : 
        pronounSet.possessive
    );
    
    return result;
  }

  // ====== PRIVACY MANAGEMENT ======

  /**
   * Get visibility levels with descriptions
   */
  getVisibilityLevels(): Array<{
    level: VisibilityLevel;
    label: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        level: 'family',
        label: 'Family',
        description: 'Visible to all family members',
        icon: '👨‍👩‍👧‍👦'
      },
      {
        level: 'admins',
        label: 'Admins Only',
        description: 'Visible only to family administrators',
        icon: '👑'
      },
      {
        level: 'private',
        label: 'Private',
        description: 'Only visible to you',
        icon: '🔒'
      }
    ];
  }

  /**
   * Check if information should be visible to a user
   */
  canViewInformation(
    visibility: VisibilityLevel,
    viewerRole: 'admin' | 'member',
    isOwner: boolean
  ): boolean {
    // Owner can always see their own information
    if (isOwner) return true;
    
    switch (visibility) {
      case 'family':
        return true; // Anyone in family can see
      case 'admins':
        return viewerRole === 'admin';
      case 'private':
        return false; // Only owner can see
      default:
        return false;
    }
  }

  // ====== IDENTITY UTILITIES ======

  /**
   * Create identity from form data
   */
  createIdentity(
    primaryIdentity: IdentityOption,
    customIdentity: string | undefined,
    ageCategory: 'child' | 'teen' | 'adult'
  ): UserIdentity {
    return {
      primaryIdentity,
      customIdentity: primaryIdentity === 'Other' ? customIdentity : undefined,
      ageCategory
    };
  }

  /**
   * Get display name for identity
   */
  getIdentityDisplayName(identity: UserIdentity): string {
    if (identity.primaryIdentity === 'Other' && identity.customIdentity) {
      return identity.customIdentity;
    }
    return identity.primaryIdentity;
  }

  /**
   * Get identity with age-appropriate display
   */
  getAgeAppropriateIdentityDisplay(identity: UserIdentity, viewerAgeCategory: 'child' | 'teen' | 'adult'): string {
    const displayName = this.getIdentityDisplayName(identity);
    
    // For younger viewers, simplify complex identities
    if (viewerAgeCategory === 'child') {
      const simplifications: Record<string, string> = {
        'Non Binary': 'Other',
        'Genderfluid': 'Other',
        'Agender': 'Other',
        'Demigender': 'Other',
        'Two Spirit': 'Other',
        'Questioning': 'Other'
      };
      
      return simplifications[displayName] || displayName;
    }
    
    return displayName;
  }

  /**
   * Generate identity badge/icon
   */
  getIdentityIcon(identity: UserIdentity): string {
    const icons: Partial<Record<IdentityOption, string>> = {
      'Boy': '👦',
      'Girl': '👧',
      'Man': '👨',
      'Woman': '👩',
      'Non Binary': '🧑',
      'Genderfluid': '🌊',
      'Agender': '⭕',
      'Demigender': '🔘',
      'Two Spirit': '🪶',
      'Questioning': '❓',
      'Prefer Not to Say': '🤐',
      'Other': '✨'
    };
    
    return icons[identity.primaryIdentity] || '👤';
  }

  /**
   * Validate identity data
   */
  validateIdentity(identity: UserIdentity): { valid: boolean; error?: string } {
    if (!identity.primaryIdentity) {
      return { valid: false, error: 'Primary identity is required' };
    }
    
    if (identity.primaryIdentity === 'Other' && !identity.customIdentity?.trim()) {
      return { valid: false, error: 'Custom identity is required when selecting "Other"' };
    }
    
    if (!['child', 'teen', 'adult'].includes(identity.ageCategory)) {
      return { valid: false, error: 'Invalid age category' };
    }
    
    return { valid: true };
  }
}

export const identityService = IdentityService.getInstance();