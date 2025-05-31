import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BirthdayCountdown, VisibilityLevel } from '../../types';
import { birthdayService } from '../../services/birthdayService';
import { identityService } from '../../services/identityService';
import { useColorScheme } from '../../hooks/useColorScheme';

interface BirthdayManagerProps {
  birthday?: string;
  birthdayCountdown?: BirthdayCountdown;
  visibility?: VisibilityLevel;
  onBirthdayChange: (birthday: string) => void;
  onVisibilityChange: (visibility: VisibilityLevel) => void;
  isEditing?: boolean;
}

export function BirthdayManager({
  birthday,
  birthdayCountdown,
  visibility = 'family',
  onBirthdayChange,
  onVisibilityChange,
  isEditing = false
}: BirthdayManagerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    birthday ? new Date(birthday) : new Date(2000, 0, 1)
  );
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);

  const styles = createStyles(isDark);

  useEffect(() => {
    if (birthday) {
      setSelectedDate(new Date(birthday));
    }
  }, [birthday]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      const validation = birthdayService.validateBirthday(date.toISOString());
      if (validation.valid) {
        setSelectedDate(date);
        onBirthdayChange(date.toISOString());
      } else {
        Alert.alert('Invalid Date', validation.error);
      }
    }
  };

  const handleShowDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleVisibilitySelect = (newVisibility: VisibilityLevel) => {
    onVisibilityChange(newVisibility);
    setShowPrivacyOptions(false);
  };

  const formatBirthdayDisplay = () => {
    if (!birthday) return 'Not set';
    
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getZodiacInfo = () => {
    if (!birthday) return null;
    
    const date = new Date(birthday);
    const zodiacSign = birthdayService.getZodiacSign(date.getMonth() + 1, date.getDate());
    const emoji = birthdayService.getZodiacEmoji(zodiacSign);
    const description = birthdayService.getZodiacDescription(zodiacSign);
    
    return { sign: zodiacSign, emoji, description };
  };

  const renderCountdown = () => {
    if (!birthdayCountdown) return null;

    return (
      <View style={styles.countdownCard}>
        <Text style={styles.countdownTitle}>🎂 Birthday Countdown</Text>
        
        {birthdayCountdown.isToday ? (
          <View style={styles.birthdayToday}>
            <Text style={styles.birthdayTodayText}>🎉 Happy Birthday! 🎉</Text>
          </View>
        ) : (
          <View style={styles.countdownInfo}>
            <Text style={styles.countdownDays}>{birthdayCountdown.daysUntil}</Text>
            <Text style={styles.countdownLabel}>
              {birthdayCountdown.daysUntil === 1 ? 'day' : 'days'} until birthday
            </Text>
            
            {birthdayCountdown.isThisWeek && (
              <View style={styles.urgencyBadge}>
                <Text style={styles.urgencyText}>This Week! 🎈</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderZodiacInfo = () => {
    const zodiac = getZodiacInfo();
    if (!zodiac) return null;

    return (
      <View style={styles.zodiacCard}>
        <Text style={styles.zodiacTitle}>✨ Zodiac Sign</Text>
        <View style={styles.zodiacInfo}>
          <Text style={styles.zodiacEmoji}>{zodiac.emoji}</Text>
          <View style={styles.zodiacDetails}>
            <Text style={styles.zodiacSign}>{zodiac.sign}</Text>
            <Text style={styles.zodiacDescription}>{zodiac.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPrivacySelector = () => {
    const visibilityLevels = identityService.getVisibilityLevels();
    const currentLevel = visibilityLevels.find(level => level.level === visibility);

    return (
      <View style={styles.privacySection}>
        <TouchableOpacity
          style={styles.privacyButton}
          onPress={() => setShowPrivacyOptions(!showPrivacyOptions)}
          accessibilityRole="button"
          accessibilityLabel="Change birthday privacy settings"
        >
          <Text style={styles.privacyLabel}>Who can see birthday:</Text>
          <View style={styles.privacyValue}>
            <Text style={styles.privacyIcon}>{currentLevel?.icon}</Text>
            <Text style={styles.privacyText}>{currentLevel?.label}</Text>
            <Text style={styles.chevron}>{showPrivacyOptions ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {showPrivacyOptions && (
          <View style={styles.privacyOptions}>
            {visibilityLevels.map((level) => (
              <TouchableOpacity
                key={level.level}
                style={[
                  styles.privacyOption,
                  visibility === level.level && styles.privacyOptionSelected
                ]}
                onPress={() => handleVisibilitySelect(level.level)}
              >
                <Text style={styles.privacyOptionIcon}>{level.icon}</Text>
                <View style={styles.privacyOptionContent}>
                  <Text style={[
                    styles.privacyOptionTitle,
                    visibility === level.level && styles.privacyOptionTitleSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.privacyOptionDescription}>
                    {level.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!isEditing && !birthday) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🎂</Text>
        <Text style={styles.emptyTitle}>No Birthday Set</Text>
        <Text style={styles.emptyDescription}>
          Add your birthday to see countdown and zodiac info
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>📅 Birthday</Text>
          
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={handleShowDatePicker}
            accessibilityRole="button"
            accessibilityLabel="Select birthday date"
          >
            <Text style={styles.dateSelectorLabel}>Birthday Date:</Text>
            <Text style={styles.dateSelectorValue}>
              {formatBirthdayDisplay()}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}

          {renderPrivacySelector()}
        </View>
      ) : (
        <View style={styles.displaySection}>
          <View style={styles.birthdayHeader}>
            <Text style={styles.birthdayDate}>{formatBirthdayDisplay()}</Text>
            {birthday && (
              <Text style={styles.ageDisplay}>
                Age: {birthdayService.calculateAge(birthday)}
              </Text>
            )}
          </View>

          {renderCountdown()}
          {renderZodiacInfo()}
        </View>
      )}
    </View>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    textAlign: 'center',
    lineHeight: 22,
  },
  editSection: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  displaySection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 16,
  },
  birthdayHeader: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    alignItems: 'center',
  },
  birthdayDate: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    textAlign: 'center',
    marginBottom: 8,
  },
  ageDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  dateSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  dateSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    flex: 1,
    textAlign: 'right',
    marginHorizontal: 12,
  },
  chevron: {
    fontSize: 12,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
  countdownCard: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 16,
  },
  birthdayToday: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  birthdayTodayText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  countdownInfo: {
    alignItems: 'center',
  },
  countdownDays: {
    fontSize: 48,
    fontWeight: '700',
    color: isDark ? '#f9a8d4' : '#be185d',
    marginBottom: 8,
  },
  countdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 12,
  },
  urgencyBadge: {
    backgroundColor: isDark ? '#4a1f35' : '#f9a8d4',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
  },
  zodiacCard: {
    backgroundColor: isDark ? '#2d1520' : '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  zodiacTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 16,
  },
  zodiacInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zodiacEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  zodiacDetails: {
    flex: 1,
  },
  zodiacSign: {
    fontSize: 20,
    fontWeight: '700',
    color: isDark ? '#f9a8d4' : '#be185d',
    marginBottom: 4,
  },
  zodiacDescription: {
    fontSize: 16,
    color: isDark ? '#f9a8d4' : '#9f1239',
    lineHeight: 22,
  },
  privacySection: {
    marginTop: 8,
  },
  privacyButton: {
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#f9a8d4' : '#9f1239',
    marginBottom: 8,
  },
  privacyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    flex: 1,
  },
  privacyOptions: {
    marginTop: 8,
    backgroundColor: isDark ? '#1a0a0f' : '#fdf2f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? '#4a1f35' : '#f9a8d4',
    overflow: 'hidden',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#4a1f35' : '#f9a8d4',
  },
  privacyOptionSelected: {
    backgroundColor: isDark ? '#4a1f35' : '#be185d',
  },
  privacyOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#fbcfe8' : '#831843',
    marginBottom: 4,
  },
  privacyOptionTitleSelected: {
    color: '#ffffff',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: isDark ? '#f9a8d4' : '#9f1239',
  },
});