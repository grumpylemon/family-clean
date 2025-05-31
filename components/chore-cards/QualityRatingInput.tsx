import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QualityRating } from '../../types';

interface Props {
  onSubmit: (qualityRating: QualityRating, satisfactionRating: number, comments?: string, photos?: string[]) => void;
  onPreferenceUpdate: (rating: number, notes?: string) => void;
  choreTitle: string;
}

const QualityRatingInput: React.FC<Props> = ({
  onSubmit,
  onPreferenceUpdate,
  choreTitle
}) => {
  const [qualityRating, setQualityRating] = useState<QualityRating | null>(null);
  const [satisfactionRating, setSatisfactionRating] = useState<number>(3);
  const [comments, setComments] = useState('');
  const [showComments, setShowComments] = useState(false);

  const qualityOptions = [
    {
      value: 'incomplete' as QualityRating,
      title: 'Incomplete',
      description: 'Task not finished or needs major work',
      icon: 'close-circle',
      color: '#ef4444',
      points: '0%'
    },
    {
      value: 'partial' as QualityRating,
      title: 'Partial',
      description: 'Some work done but more needed',
      icon: 'remove-circle',
      color: '#f59e0b',
      points: '50%'
    },
    {
      value: 'complete' as QualityRating,
      title: 'Complete',
      description: 'Task finished to standard',
      icon: 'checkmark-circle',
      color: '#10b981',
      points: '100%'
    },
    {
      value: 'excellent' as QualityRating,
      title: 'Excellent',
      description: 'Above and beyond expectations',
      icon: 'star',
      color: '#be185d',
      points: '110%'
    }
  ];

  const satisfactionEmojis = [
    { value: 1, emoji: '😤', label: 'Hate it' },
    { value: 2, emoji: '😕', label: 'Dislike' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Like it' },
    { value: 5, emoji: '😊', label: 'Love it' }
  ];

  const handleSubmit = () => {
    if (!qualityRating) {
      Alert.alert('Quality Rating Required', 'Please select how well you completed this task.');
      return;
    }

    // Update preference
    onPreferenceUpdate(satisfactionRating, comments || undefined);
    
    // Submit completion
    onSubmit(qualityRating, satisfactionRating, comments || undefined);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How did you do?</Text>
      <Text style={styles.subtitle}>Rate your completion of "{choreTitle}"</Text>

      {/* Quality Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Assessment</Text>
        <View style={styles.qualityOptions}>
          {qualityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.qualityOption,
                qualityRating === option.value && styles.qualityOptionSelected,
                { borderColor: option.color }
              ]}
              onPress={() => setQualityRating(option.value)}
            >
              <View style={styles.qualityHeader}>
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={qualityRating === option.value ? option.color : '#d1d5db'} 
                />
                <View style={styles.qualityInfo}>
                  <Text style={[
                    styles.qualityTitle,
                    qualityRating === option.value && { color: option.color }
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={styles.qualityPoints}>{option.points} points</Text>
                </View>
              </View>
              <Text style={styles.qualityDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Satisfaction Rating */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How did you feel about this task?</Text>
        <View style={styles.satisfactionOptions}>
          {satisfactionEmojis.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.satisfactionOption,
                satisfactionRating === option.value && styles.satisfactionOptionSelected
              ]}
              onPress={() => setSatisfactionRating(option.value)}
            >
              <Text style={styles.satisfactionEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.satisfactionLabel,
                satisfactionRating === option.value && styles.satisfactionLabelSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Comments */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.commentsToggle}
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.commentsToggleText}>Add Comments (Optional)</Text>
          <Ionicons 
            name={showComments ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#be185d" 
          />
        </TouchableOpacity>
        
        {showComments && (
          <TextInput
            style={styles.commentsInput}
            placeholder="Share your thoughts about completing this task..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          !qualityRating && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!qualityRating}
      >
        <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
        <Text style={styles.submitText}>Complete Task</Text>
      </TouchableOpacity>

      {/* Help Text */}
      <Text style={styles.helpText}>
        💡 Your feedback helps us assign tasks that match your preferences!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  qualityOptions: {
    gap: 12,
  },
  qualityOption: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  qualityOptionSelected: {
    backgroundColor: '#fef7ff',
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  qualityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  qualityPoints: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9f1239',
  },
  qualityDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  satisfactionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  satisfactionOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  satisfactionOptionSelected: {
    backgroundColor: '#fef7ff',
    borderColor: '#be185d',
  },
  satisfactionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  satisfactionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  satisfactionLabelSelected: {
    color: '#be185d',
    fontWeight: '600',
  },
  commentsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  commentsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
  },
  commentsInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default QualityRatingInput;