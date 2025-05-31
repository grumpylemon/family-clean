import { UserAvatar, AvatarOptions } from '../types';

// Avatar service for managing user avatars with DiceBear/Avataaars and Google Drive integration
export class AvatarService {
  private static instance: AvatarService;
  private apiCache: Map<string, string> = new Map();
  private validationCache: Map<string, boolean> = new Map();

  static getInstance(): AvatarService {
    if (!AvatarService.instance) {
      AvatarService.instance = new AvatarService();
    }
    return AvatarService.instance;
  }

  // ====== DICEBEAR INTEGRATION ======

  /**
   * Generate DiceBear avatar URL
   */
  generateDiceBearAvatar(style: string, seed: string, options: AvatarOptions = {}): string {
    const cacheKey = `dicebear-${style}-${seed}-${JSON.stringify(options)}`;
    
    if (this.apiCache.has(cacheKey)) {
      return this.apiCache.get(cacheKey)!;
    }

    const baseUrl = `https://api.dicebear.com/7.x/${style}/svg`;
    const params = new URLSearchParams();
    
    // Add seed
    params.append('seed', seed);
    
    // Add customization options
    if (options.backgroundColor?.length) {
      params.append('backgroundColor', options.backgroundColor.join(','));
    }
    if (options.clothingColor?.length) {
      params.append('clothingColor', options.clothingColor.join(','));
    }
    if (options.eyeColor?.length) {
      params.append('eyeColor', options.eyeColor.join(','));
    }
    if (options.hairColor?.length) {
      params.append('hairColor', options.hairColor.join(','));
    }
    if (options.skinColor?.length) {
      params.append('skinColor', options.skinColor.join(','));
    }
    if (typeof options.accessoriesChance === 'number') {
      params.append('accessoriesChance', options.accessoriesChance.toString());
    }
    if (typeof options.facialHairChance === 'number') {
      params.append('facialHairChance', options.facialHairChance.toString());
    }

    // Add any additional custom options
    Object.entries(options).forEach(([key, value]) => {
      if (!['backgroundColor', 'clothingColor', 'eyeColor', 'hairColor', 'skinColor', 'accessoriesChance', 'facialHairChance'].includes(key)) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else if (typeof value === 'string' || typeof value === 'number') {
          params.append(key, value.toString());
        }
      }
    });

    const url = `${baseUrl}?${params.toString()}`;
    this.apiCache.set(cacheKey, url);
    
    return url;
  }

  /**
   * Get available DiceBear styles
   */
  getDiceBearStyles(): Array<{id: string, name: string, description: string}> {
    return [
      { id: 'personas', name: 'Personas', description: 'Modern human-like avatars' },
      { id: 'avataaars', name: 'Avataaars', description: 'Sketch-style cartoon avatars' },
      { id: 'bottts', name: 'Bottts', description: 'Robot-style avatars' },
      { id: 'micah', name: 'Micah', description: 'Simple human avatars' },
      { id: 'lorelei', name: 'Lorelei', description: 'Female-focused avatars' },
      { id: 'notionists', name: 'Notionists', description: 'Notion-style avatars' },
      { id: 'fun-emoji', name: 'Fun Emoji', description: 'Colorful emoji-style' },
      { id: 'thumbs', name: 'Thumbs', description: 'Thumbs up/down avatars' }
    ];
  }

  // ====== AVATAAARS INTEGRATION ======

  /**
   * Generate Avataaars avatar URL (via DiceBear's avataaars style)
   */
  generateAvataaarsAvatar(seed: string, options: AvatarOptions = {}): string {
    return this.generateDiceBearAvatar('avataaars', seed, options);
  }

  /**
   * Get Avataaars customization options
   */
  getAvataaarsOptions(): Record<string, string[]> {
    return {
      topType: ['NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4', 'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy', 'LongHairDreads', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand', 'LongHairNotTooLong', 'LongHairShavedSides', 'LongHairMiaWallace', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle', 'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides', 'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart'],
      accessoriesType: ['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'],
      hairColor: ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Platinum', 'Red', 'SilverGray'],
      facialHairType: ['Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'],
      clotheType: ['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'],
      eyeType: ['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky'],
      eyebrowType: ['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural'],
      mouthType: ['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'],
      skinColor: ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black']
    };
  }

  // ====== GOOGLE DRIVE INTEGRATION ======

  /**
   * Validate Google Drive image URL
   */
  async validateGoogleDriveUrl(url: string): Promise<{valid: boolean, processedUrl?: string, error?: string}> {
    const cacheKey = `gdrive-${url}`;
    
    if (this.validationCache.has(cacheKey)) {
      const isValid = this.validationCache.get(cacheKey)!;
      return { valid: isValid, processedUrl: isValid ? this.processGoogleDriveUrl(url) : undefined };
    }

    try {
      // Convert Google Drive sharing URL to direct image URL
      const processedUrl = this.processGoogleDriveUrl(url);
      
      if (!processedUrl) {
        this.validationCache.set(cacheKey, false);
        return { valid: false, error: 'Invalid Google Drive URL format' };
      }

      // Test if image loads
      const response = await fetch(processedUrl, { method: 'HEAD' });
      const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/');
      
      this.validationCache.set(cacheKey, isValid);
      
      return {
        valid: isValid,
        processedUrl: isValid ? processedUrl : undefined,
        error: isValid ? undefined : 'Unable to access image from Google Drive URL'
      };
    } catch (error) {
      this.validationCache.set(cacheKey, false);
      return { valid: false, error: 'Network error validating Google Drive URL' };
    }
  }

  /**
   * Convert Google Drive sharing URL to direct image URL
   */
  private processGoogleDriveUrl(url: string): string | null {
    // Extract file ID from various Google Drive URL formats
    let fileId: string | null = null;

    // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    let match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      fileId = match[1];
    }

    // Format 2: https://drive.google.com/open?id=FILE_ID
    if (!fileId) {
      match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (match) {
        fileId = match[1];
      }
    }

    // Format 3: https://drive.google.com/uc?id=FILE_ID
    if (!fileId) {
      match = url.match(/\/uc\?id=([a-zA-Z0-9-_]+)/);
      if (match) {
        fileId = match[1];
      }
    }

    if (!fileId) {
      return null;
    }

    // Convert to direct image URL
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // ====== AVATAR MANAGEMENT ======

  /**
   * Create a new avatar configuration
   */
  async createAvatar(config: {
    type: 'generated' | 'uploaded';
    generatedConfig?: {
      provider: 'dicebear' | 'avataaars';
      style: string;
      seed: string;
      options: AvatarOptions;
    };
    uploadedConfig?: {
      googleDriveUrl: string;
    };
  }): Promise<UserAvatar> {
    const avatar: UserAvatar = {
      type: config.type,
      lastUpdated: new Date().toISOString()
    };

    if (config.type === 'generated' && config.generatedConfig) {
      const { provider, style, seed, options } = config.generatedConfig;
      
      let url: string;
      if (provider === 'dicebear') {
        url = this.generateDiceBearAvatar(style, seed, options);
      } else {
        url = this.generateAvataaarsAvatar(seed, options);
      }

      avatar.generatedConfig = {
        provider,
        style,
        seed,
        options,
        url
      };

      // Set fallback to a simple generated avatar
      avatar.fallbackUrl = this.generateDiceBearAvatar('initials', seed, { backgroundColor: ['#be185d'] });
    }

    if (config.type === 'uploaded' && config.uploadedConfig) {
      const validation = await this.validateGoogleDriveUrl(config.uploadedConfig.googleDriveUrl);
      
      if (!validation.valid || !validation.processedUrl) {
        throw new Error(validation.error || 'Invalid Google Drive URL');
      }

      avatar.uploadedConfig = {
        googleDriveUrl: config.uploadedConfig.googleDriveUrl,
        processedUrl: validation.processedUrl,
        uploadedAt: new Date().toISOString(),
        validated: true
      };

      // Set fallback to a generated avatar
      const fallbackSeed = config.uploadedConfig.googleDriveUrl.slice(-10);
      avatar.fallbackUrl = this.generateDiceBearAvatar('initials', fallbackSeed, { backgroundColor: ['#be185d'] });
    }

    return avatar;
  }

  /**
   * Get avatar display URL with fallback handling
   */
  getAvatarUrl(avatar: UserAvatar | null | undefined): string {
    if (!avatar) {
      // Default avatar for users without avatars
      return this.generateDiceBearAvatar('initials', 'default', { backgroundColor: ['#be185d'] });
    }

    // Try primary avatar URL
    if (avatar.type === 'generated' && avatar.generatedConfig?.url) {
      return avatar.generatedConfig.url;
    }

    if (avatar.type === 'uploaded' && avatar.uploadedConfig?.processedUrl && avatar.uploadedConfig.validated) {
      return avatar.uploadedConfig.processedUrl;
    }

    // Fall back to fallback URL
    if (avatar.fallbackUrl) {
      return avatar.fallbackUrl;
    }

    // Ultimate fallback
    return this.generateDiceBearAvatar('initials', 'fallback', { backgroundColor: ['#be185d'] });
  }

  /**
   * Generate random avatar seed
   */
  generateRandomSeed(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get default avatar options for quick generation
   */
  getDefaultAvatarOptions(): AvatarOptions {
    return {
      backgroundColor: ['#be185d', '#f9a8d4', '#fbcfe8'],
      accessoriesChance: 30,
      facialHairChance: 20
    };
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCache(): void {
    this.apiCache.clear();
    this.validationCache.clear();
  }
}

export const avatarService = AvatarService.getInstance();