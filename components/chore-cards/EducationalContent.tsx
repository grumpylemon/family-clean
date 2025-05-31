import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EducationalFact, InspirationalQuote } from '../../types';

interface Props {
  fact: EducationalFact | null;
  quote: InspirationalQuote | null;
  onFactEngagement?: () => void;
  onQuoteEngagement?: () => void;
}

const EducationalContent: React.FC<Props> = ({
  fact,
  quote,
  onFactEngagement,
  onQuoteEngagement
}) => {
  const [showFact, setShowFact] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [factAnimation] = useState(new Animated.Value(0));
  const [quoteAnimation] = useState(new Animated.Value(0));

  const handleFactToggle = () => {
    const toValue = showFact ? 0 : 1;
    setShowFact(!showFact);
    
    Animated.spring(factAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    if (!showFact && onFactEngagement) {
      onFactEngagement();
    }
  };

  const handleQuoteToggle = () => {
    const toValue = showQuote ? 0 : 1;
    setShowQuote(!showQuote);
    
    Animated.spring(quoteAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    if (!showQuote && onQuoteEngagement) {
      onQuoteEngagement();
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'encouraging': return '🌟';
      case 'empowering': return '💪';
      case 'fun': return '🎉';
      case 'thoughtful': return '💭';
      default: return '✨';
    }
  };

  if (!fact && !quote) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Educational Fact */}
      {fact && (
        <View style={styles.contentSection}>
          <TouchableOpacity 
            style={styles.factHeader}
            onPress={handleFactToggle}
            activeOpacity={0.7}
          >
            <View style={styles.factTitleContainer}>
              <Text style={styles.factIcon}>🧠</Text>
              <Text style={styles.factTitle}>Did You Know?</Text>
            </View>
            <Ionicons 
              name={showFact ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#be185d" 
            />
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.factContent,
              {
                maxHeight: factAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: factAnimation,
              }
            ]}
          >
            <Text style={styles.factText}>{fact.content}</Text>
            
            {fact.category && (
              <View style={styles.factMetadata}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{fact.category}</Text>
                </View>
                {fact.seasonal && (
                  <View style={styles.seasonalBadge}>
                    <Text style={styles.seasonalText}>🍂 Seasonal</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      )}

      {/* Inspirational Quote */}
      {quote && (
        <View style={styles.contentSection}>
          <TouchableOpacity 
            style={styles.quoteHeader}
            onPress={handleQuoteToggle}
            activeOpacity={0.7}
          >
            <View style={styles.quoteTitleContainer}>
              <Text style={styles.quoteIcon}>{getMoodEmoji(quote.mood)}</Text>
              <Text style={styles.quoteTitle}>Inspiration</Text>
            </View>
            <Ionicons 
              name={showQuote ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#9f1239" 
            />
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.quoteContent,
              {
                maxHeight: quoteAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150],
                }),
                opacity: quoteAnimation,
              }
            ]}
          >
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            
            {quote.author && (
              <Text style={styles.quoteAuthor}>— {quote.author}</Text>
            )}
            
            {quote.themes && quote.themes.length > 0 && (
              <View style={styles.quoteMetadata}>
                {quote.themes.slice(0, 2).map((theme, index) => (
                  <View key={index} style={styles.themeBadge}>
                    <Text style={styles.themeText}>{theme}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      )}

      {/* Engagement Encouragement */}
      {(showFact || showQuote) && (
        <View style={styles.engagementSection}>
          <Text style={styles.engagementText}>
            📚 Learning while cleaning makes every task an adventure!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  contentSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fdf4ff',
  },
  factTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#be185d',
  },
  factContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  factText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  factMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730a3',
  },
  seasonalBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  seasonalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fef7ff',
  },
  quoteTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9f1239',
  },
  quoteContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
  },
  quoteText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 12,
  },
  quoteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  themeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
  },
  engagementSection: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  engagementText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EducationalContent;