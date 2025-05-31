import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { User, UserAvatar, UserIdentity, UserQuestionnaire } from '../../types';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { AvatarBuilder } from './AvatarBuilder';
import { BirthdayManager } from './BirthdayManager';
import { IdentitySelector } from './IdentitySelector';
import { QuestionnaireModal } from './QuestionnaireModal';
import { profileService } from '../../services/profileService';
import { birthdayService } from '../../services/birthdayService';
import { useColorScheme } from '../../hooks/useColorScheme';

interface AdvancedUserProfileProps {
  user: User;
  onProfileUpdate: (updates: Partial<User>) => void;
  canEdit?: boolean;
  showPrivacyControls?: boolean;
  viewerRole?: 'admin' | 'member';
}

export function AdvancedUserProfile({
  user,
  onProfileUpdate,
  canEdit = true,
  showPrivacyControls = true,
  viewerRole = 'member'
}: AdvancedUserProfileProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [editing, setEditing] = useState(false);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(isDark);

  const isOwner = true; // In real implementation, check if user is viewing their own profile
  const displayProfile = profileService.getDisplayProfile(user, viewerRole, isOwner);
  const profileCompletion = profileService.getProfileCompletionPercentage(user);

  const handleAvatarCreated = async (avatar: UserAvatar) => {
    try {
      setLoading(true);
      const updates = await profileService.updateProfile(user.uid, { avatar });
      onProfileUpdate(updates);
      setShowAvatarBuilder(false);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleBirthdayChange = async (birthday: string) => {
    try {
      setLoading(true);
      const updates = await profileService.updateProfile(user.uid, { 
        birthday,
        identity: user.identity ? {
          ...user.identity,
          ageCategory: birthdayService.getAgeCategoryFromBirthday(birthday)
        } : undefined
      });
      onProfileUpdate(updates);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update birthday');
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityChange = async (identity: UserIdentity) => {
    try {
      setLoading(true);
      const updates = await profileService.updateProfile(user.uid, { identity });
      onProfileUpdate(updates);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update identity');
    } finally {
      setLoading(false);
    }
  };

  const handlePronounsChange = async (pronouns: string) => {
    try {
      setLoading(true);
      const updates = await profileService.updateProfile(user.uid, { pronouns });
      onProfileUpdate(updates);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update pronouns');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = async (field: string, visibility: any) => {
    try {
      setLoading(true);
      const updates = await profileService.updateProfile(user.uid, {
        privacySettings: { [field]: visibility }
      });
      onProfileUpdate(updates);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (questionnaire: UserQuestionnaire, xpReward: number) => {
    try {
      setLoading(true);
      const updates: Partial<User> = {
        questionnaire,
        questionnaireCompletedAt: new Date().toISOString(),
        xp: user.xp ? {
          ...user.xp,
          current: user.xp.current + xpReward,
          total: user.xp.total + xpReward
        } : { current: xpReward, toNextLevel: 1000 - xpReward, total: xpReward }
      };
      
      onProfileUpdate(updates);
      setShowQuestionnaireModal(false);
      
      Alert.alert(
        'Questionnaire Complete! 🎉',
        `You earned ${xpReward} XP for sharing about yourself!`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const canUnlockQuestionnaire = () => {
    if (user.questionnaireUnlocked) return true;
    const unlock = profileService.unlockQuestionnaire(user, viewerRole === 'admin');
    return unlock.unlocked;
  };

  const handleUnlockQuestionnaire = () => {
    if (canUnlockQuestionnaire()) {
      setShowQuestionnaireModal(true);
    } else {
      Alert.alert(
        'Questionnaire Locked',
        'Reach level 2 to unlock the personality questionnaire and learn more about yourself!',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => canEdit && setShowAvatarBuilder(true)}
        disabled={!canEdit}
      >
        <AvatarDisplay
          avatar={displayProfile.avatar}
          size="xlarge"
          fallbackInitials={user.displayName?.charAt(0) || 'U'}
        />
        {canEdit && (
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditText}>✏️</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>
          {user.displayName || 'Unknown User'}
        </Text>
        
        {displayProfile.identity && (
          <Text style={styles.profileIdentity}>
            {displayProfile.identity.primaryIdentity === 'Other' && displayProfile.identity.customIdentity
              ? displayProfile.identity.customIdentity
              : displayProfile.identity.primaryIdentity}
          </Text>
        )}
        
        {displayProfile.pronouns && (
          <Text style={styles.profilePronouns}>
            {displayProfile.pronouns}
          </Text>
        )}
        
        {displayProfile.age && (
          <Text style={styles.profileAge}>
            Age {displayProfile.age}
          </Text>
        )}
      </View>
    </View>
  );

  const renderCompletionBadge = () => (
    <View style={styles.completionSection}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionTitle}>Profile Completion</Text>
        <Text style={styles.completionPercentage}>{profileCompletion.percentage}%</Text>
      </View>
      
      <View style={styles.completionBar}>
        <View style={[styles.completionFill, { width: `${profileCompletion.percentage}%` }]} />
      </View>
      
      {profileCompletion.missingSections.length > 0 && (
        <Text style={styles.completionHint}>
          Add: {profileCompletion.missingSections.join(', ')}
        </Text>
      )}
    </View>
  );

  const renderQuestionnaireSection = () => {
    const hasQuestionnaire = !!user.questionnaire;
    const canUnlock = canUnlockQuestionnaire();
    
    return (
      <View style={styles.questionnaireSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🧠 Personality Questionnaire</Text>
          {hasQuestionnaire && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Complete</Text>
            </View>
          )}
        </View>
        
        {hasQuestionnaire ? (
          <View style={styles.questionnaireComplete}>
            <Text style={styles.questionnaireCompleteText}>
              Completed on {new Date(user.questionnaireCompletedAt!).toLocaleDateString()}
            </Text>
            
            {user.questionnaire?.personalityProfile && (
              <View style={styles.personalityInsights}>
                <Text style={styles.insightLabel}>Motivation Style:</Text>
                <Text style={styles.insightValue}>
                  {user.questionnaire.personalityProfile.motivationStyle}
                </Text>
                
                <Text style={styles.insightLabel}>Learning Style:</Text>
                <Text style={styles.insightValue}>
                  {user.questionnaire.personalityProfile.learningStyle}
                </Text>
              </View>
            )}
            
            {canEdit && (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleUnlockQuestionnaire}
              >
                <Text style={styles.retakeButtonText}>Update Answers</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.questionnaireEmpty}>
            <Text style={styles.questionnaireEmptyText}>
              {canUnlock 
                ? 'Discover your personality traits and preferences!'
                : `Unlock at Level 2 (currently level ${user.level || 0})`}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.startQuestionnaireButton,
                !canUnlock && styles.startQuestionnaireButtonDisabled
              ]}
              onPress={handleUnlockQuestionnaire}
              disabled={!canUnlock}
            >
              <Text style={[
                styles.startQuestionnaireButtonText,
                !canUnlock && styles.startQuestionnaireButtonTextDisabled
              ]}>
                {canUnlock ? 'Start Questionnaire' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderCompletionBadge()}
        
        <BirthdayManager
          birthday={displayProfile.birthday}
          birthdayCountdown={displayProfile.birthdayCountdown}
          visibility={user.birthdayVisibility}
          onBirthdayChange={handleBirthdayChange}
          onVisibilityChange={(visibility) => handlePrivacyChange('birthday', visibility)}
          isEditing={editing}
        />
        
        <IdentitySelector
          identity={displayProfile.identity}
          pronouns={displayProfile.pronouns}
          visibility={user.identityVisibility}
          ageCategory={displayProfile.identity?.ageCategory || 'adult'}
          onIdentityChange={handleIdentityChange}
          onPronounsChange={handlePronounsChange}
          onVisibilityChange={(visibility) => handlePrivacyChange('identity', visibility)}
          isEditing={editing}
        />
        
        {renderQuestionnaireSection()}
      </ScrollView>
      
      {canEdit && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, editing ? styles.cancelButton : styles.editButton]}
            onPress={() => setEditing(!editing)}
          >
            <Text style={[styles.actionButtonText, editing && styles.cancelButtonText]}>
              {editing ? 'Done' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <AvatarBuilder
        currentAvatar={user.avatar}
        onAvatarCreated={handleAvatarCreated}
        onCancel={() => setShowAvatarBuilder(false)}
        isVisible={showAvatarBuilder}
      />

      <QuestionnaireModal
        isVisible={showQuestionnaireModal}
        ageCategory={displayProfile.identity?.ageCategory || 'adult'}
        existingQuestionnaire={user.questionnaire}
        onComplete={handleQuestionnaireComplete}
        onCancel={() => setShowQuestionnaireModal(false)}
      />
    </View>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 20,
    margin: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#2d1520' : '#ffffff',
  },
  avatarEditText: {
    fontSize: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 4,
  },
  profileIdentity: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#be185d',
    marginBottom: 2,
  },
  profilePronouns: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 2,
  },
  profileAge: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  completionSection: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  completionPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#f9a8d4' : '#be185d',
  },
  completionBar: {
    height: 8,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completionFill: {
    height: '100%',
    backgroundColor: isDark ? '#f9a8d4' : '#be185d',
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
    fontStyle: 'italic',
  },
  questionnaireSection: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  completedBadge: {
    backgroundColor: isDark ? '#4a1f35' : '#10b981',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionnaireComplete: {
    alignItems: 'center',
  },
  questionnaireCompleteText: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 16,
  },
  personalityInsights: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  retakeButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  questionnaireEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  questionnaireEmptyText: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  startQuestionnaireButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startQuestionnaireButtonDisabled: {
    backgroundColor: isDark ? '#2d1520' : '#f9a8d4',
    shadowOpacity: 0,
    elevation: 0,
  },
  startQuestionnaireButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  startQuestionnaireButtonTextDisabled: {
    color: isDark ? '#9f7086' : '#831843',
  },
  actionBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: isDark ? '#000000' : '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButton: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
  },
  cancelButton: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#be185d',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButtonText: {
    color: isDark ? '#f9a8d4' : '#be185d',
  },
});