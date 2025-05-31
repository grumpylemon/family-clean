import { safeCollection } from '../config/firebase';
import {
  EducationalFact,
  InspirationalQuote,
  LearningObjective,
  AgeGroup,
  ChoreType
} from '../types';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';

// Version identifier for service
console.log("EducationalContentService version: v1.0");

// Collection references
const getEducationalFactsCollection = () => safeCollection('educationalFacts');
const getInspirationalQuotesCollection = () => safeCollection('inspirationalQuotes');
const getLearningObjectivesCollection = () => safeCollection('learningObjectives');

/**
 * Educational Content Service
 * Manages educational facts, inspirational quotes, and learning objectives
 * for the Advanced Chore Cards system
 */
class EducationalContentService {

  // ============ EDUCATIONAL FACTS ============

  /**
   * Get a random educational fact for a chore
   */
  async getRandomFact(ageGroup: AgeGroup, choreType?: ChoreType): Promise<EducationalFact | null> {
    try {
      let queryConstraints = [
        where('ageGroups', 'array-contains', ageGroup)
      ];

      if (choreType) {
        queryConstraints.push(where('choreTypes', 'array-contains', choreType));
      }

      const q = query(
        getEducationalFactsCollection(),
        ...queryConstraints,
        limit(50) // Get more facts to randomize from
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        // Fallback to any fact for the age group
        return this.getFallbackFact(ageGroup);
      }

      const facts = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as EducationalFact;
      });
      
      // Filter out recently shown facts if possible
      const availableFacts = facts.filter(fact => {
        if (!fact.lastShown) return true;
        const daysSinceShown = (Date.now() - new Date(fact.lastShown).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceShown > 7; // Don't repeat for a week
      });

      const factsToChooseFrom = availableFacts.length > 0 ? availableFacts : facts;
      const randomFact = factsToChooseFrom[Math.floor(Math.random() * factsToChooseFrom.length)];

      // Update last shown date
      await this.updateFactLastShown(randomFact.id!);

      return randomFact;
    } catch (error) {
      console.error('Error getting random fact:', error);
      return this.getMockFact(ageGroup, choreType);
    }
  }

  /**
   * Get fallback fact for age group
   */
  private async getFallbackFact(ageGroup: AgeGroup): Promise<EducationalFact | null> {
    try {
      const q = query(
        getEducationalFactsCollection(),
        where('ageGroups', 'array-contains', ageGroup),
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return this.getMockFact(ageGroup);

      const facts = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as EducationalFact;
      });
      return facts[Math.floor(Math.random() * facts.length)];
    } catch (error) {
      console.error('Error getting fallback fact:', error);
      return this.getMockFact(ageGroup);
    }
  }

  /**
   * Update last shown date for a fact
   */
  private async updateFactLastShown(factId: string): Promise<void> {
    try {
      const factRef = doc(getEducationalFactsCollection(), factId);
      await updateDoc(factRef, {
        lastShown: new Date().toISOString(),
        engagementScore: 1 // Could be enhanced to track actual engagement
      });
    } catch (error) {
      console.error('Error updating fact last shown:', error);
    }
  }

  /**
   * Get mock fact as fallback
   */
  private getMockFact(ageGroup: AgeGroup, choreType?: ChoreType): EducationalFact {
    const facts = {
      child: [
        {
          id: 'mock-fact-child-1',
          content: 'Did you know that soap works by grabbing onto dirt and grease? It\'s like tiny hands helping you clean!',
          ageGroups: ['child'] as AgeGroup[],
          category: 'science',
          sources: ['Educational Content Database'],
          verifiedAt: new Date().toISOString()
        },
        {
          id: 'mock-fact-child-2',
          content: 'Washing dishes with warm water helps break down grease faster than cold water!',
          ageGroups: ['child'] as AgeGroup[],
          category: 'science',
          choreTypes: ['individual', 'family'] as ChoreType[],
          sources: ['Educational Content Database'],
          verifiedAt: new Date().toISOString()
        }
      ],
      teen: [
        {
          id: 'mock-fact-teen-1',
          content: 'The average person spends about 3 years of their life cleaning. Learning efficient techniques saves time!',
          ageGroups: ['teen'] as AgeGroup[],
          category: 'productivity',
          sources: ['Time Management Studies'],
          verifiedAt: new Date().toISOString()
        },
        {
          id: 'mock-fact-teen-2',
          content: 'Microfiber cloths can pick up 99% of bacteria when used with just water - no chemicals needed!',
          ageGroups: ['teen'] as AgeGroup[],
          category: 'health',
          sources: ['Health Research Institute'],
          verifiedAt: new Date().toISOString()
        }
      ],
      adult: [
        {
          id: 'mock-fact-adult-1',
          content: 'Studies show that people who maintain organized living spaces report 42% less stress and better sleep quality.',
          ageGroups: ['adult'] as AgeGroup[],
          category: 'psychology',
          sources: ['Journal of Environmental Psychology'],
          verifiedAt: new Date().toISOString()
        },
        {
          id: 'mock-fact-adult-2',
          content: 'Regular household maintenance can increase home value by 5-10% and prevent costly repairs.',
          ageGroups: ['adult'] as AgeGroup[],
          category: 'finance',
          sources: ['Real Estate Economics Review'],
          verifiedAt: new Date().toISOString()
        }
      ]
    };

    const ageFacts = facts[ageGroup];
    return ageFacts[Math.floor(Math.random() * ageFacts.length)];
  }

  // ============ INSPIRATIONAL QUOTES ============

  /**
   * Get a random inspirational quote for a chore
   */
  async getRandomQuote(ageGroup: AgeGroup, choreType?: ChoreType, mood?: string): Promise<InspirationalQuote | null> {
    try {
      let queryConstraints = [
        where('ageGroups', 'array-contains', ageGroup)
      ];

      if (choreType) {
        queryConstraints.push(where('choreTypes', 'array-contains', choreType));
      }

      if (mood) {
        queryConstraints.push(where('mood', '==', mood));
      }

      const q = query(
        getInspirationalQuotesCollection(),
        ...queryConstraints,
        limit(30)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return this.getMockQuote(ageGroup, choreType);
      }

      const quotes = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as InspirationalQuote;
      });
      
      // Filter out recently shown quotes
      const availableQuotes = quotes.filter(quote => {
        if (!quote.lastShown) return true;
        const daysSinceShown = (Date.now() - new Date(quote.lastShown).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceShown > 3; // Don't repeat for 3 days
      });

      const quotesToChooseFrom = availableQuotes.length > 0 ? availableQuotes : quotes;
      const randomQuote = quotesToChooseFrom[Math.floor(Math.random() * quotesToChooseFrom.length)];

      // Update last shown date
      await this.updateQuoteLastShown(randomQuote.id!);

      return randomQuote;
    } catch (error) {
      console.error('Error getting random quote:', error);
      return this.getMockQuote(ageGroup, choreType);
    }
  }

  /**
   * Update last shown date for a quote
   */
  private async updateQuoteLastShown(quoteId: string): Promise<void> {
    try {
      const quoteRef = doc(getInspirationalQuotesCollection(), quoteId);
      await updateDoc(quoteRef, {
        lastShown: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating quote last shown:', error);
    }
  }

  /**
   * Get mock quote as fallback
   */
  private getMockQuote(ageGroup: AgeGroup, choreType?: ChoreType): InspirationalQuote {
    const quotes = {
      child: [
        {
          id: 'mock-quote-child-1',
          text: 'Every small task you complete is a step toward becoming more awesome!',
          ageGroups: ['child'] as AgeGroup[],
          themes: ['motivation', 'growth'],
          mood: 'encouraging' as const
        },
        {
          id: 'mock-quote-child-2',
          text: 'Teamwork makes the dream work - and the house clean!',
          ageGroups: ['child'] as AgeGroup[],
          themes: ['teamwork', 'family'],
          mood: 'fun' as const
        }
      ],
      teen: [
        {
          id: 'mock-quote-teen-1',
          text: 'The habits you build today shape the person you become tomorrow.',
          ageGroups: ['teen'] as AgeGroup[],
          themes: ['responsibility', 'growth'],
          mood: 'thoughtful' as const
        },
        {
          id: 'mock-quote-teen-2',
          text: 'Taking care of your space is taking care of yourself.',
          ageGroups: ['teen'] as AgeGroup[],
          themes: ['self-care', 'responsibility'],
          mood: 'empowering' as const
        }
      ],
      adult: [
        {
          id: 'mock-quote-adult-1',
          text: 'A clean space is a canvas for creativity and peace of mind.',
          ageGroups: ['adult'] as AgeGroup[],
          themes: ['mindfulness', 'productivity'],
          mood: 'thoughtful' as const
        },
        {
          id: 'mock-quote-adult-2',
          text: 'Excellence is not a skill, it\'s an attitude applied to everyday tasks.',
          author: 'Ralph Marston',
          ageGroups: ['adult'] as AgeGroup[],
          themes: ['excellence', 'attitude'],
          mood: 'empowering' as const
        }
      ]
    };

    const ageQuotes = quotes[ageGroup];
    return ageQuotes[Math.floor(Math.random() * ageQuotes.length)];
  }

  // ============ LEARNING OBJECTIVES ============

  /**
   * Get learning objectives for a chore
   */
  async getLearningObjectives(ageGroup: AgeGroup, choreType?: ChoreType): Promise<LearningObjective[]> {
    try {
      let queryConstraints = [
        where('ageGroups', 'array-contains', ageGroup)
      ];

      const q = query(
        getLearningObjectivesCollection(),
        ...queryConstraints,
        limit(10)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return this.getMockLearningObjectives(ageGroup, choreType);
      }

      return snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as LearningObjective;
      });
    } catch (error) {
      console.error('Error getting learning objectives:', error);
      return this.getMockLearningObjectives(ageGroup, choreType);
    }
  }

  /**
   * Get mock learning objectives as fallback
   */
  private getMockLearningObjectives(ageGroup: AgeGroup, choreType?: ChoreType): LearningObjective[] {
    const objectives = {
      child: [
        {
          id: 'mock-obj-child-1',
          title: 'Following Instructions',
          description: 'Learn to read and follow step-by-step instructions carefully',
          skills: ['reading comprehension', 'attention to detail', 'sequence understanding'],
          ageGroups: ['child'] as AgeGroup[],
          completionRewards: { points: 5, xp: 10 }
        },
        {
          id: 'mock-obj-child-2',
          title: 'Tool Safety',
          description: 'Understand how to safely use common household cleaning tools',
          skills: ['safety awareness', 'tool handling', 'risk assessment'],
          ageGroups: ['child'] as AgeGroup[],
          completionRewards: { points: 10, xp: 15 }
        }
      ],
      teen: [
        {
          id: 'mock-obj-teen-1',
          title: 'Efficiency Optimization',
          description: 'Learn to complete tasks efficiently while maintaining quality',
          skills: ['time management', 'process optimization', 'quality control'],
          ageGroups: ['teen'] as AgeGroup[],
          completionRewards: { points: 15, xp: 20 }
        },
        {
          id: 'mock-obj-teen-2',
          title: 'Chemical Safety',
          description: 'Understand proper handling and mixing of cleaning chemicals',
          skills: ['chemical safety', 'reading labels', 'proper ventilation'],
          ageGroups: ['teen'] as AgeGroup[],
          completionRewards: { points: 20, xp: 25 }
        }
      ],
      adult: [
        {
          id: 'mock-obj-adult-1',
          title: 'Maintenance Planning',
          description: 'Develop skills in preventive maintenance and long-term care',
          skills: ['strategic planning', 'preventive maintenance', 'cost-benefit analysis'],
          ageGroups: ['adult'] as AgeGroup[],
          completionRewards: { points: 25, xp: 30 }
        },
        {
          id: 'mock-obj-adult-2',
          title: 'Environmental Consciousness',
          description: 'Learn eco-friendly cleaning methods and sustainable practices',
          skills: ['environmental awareness', 'sustainable practices', 'green chemistry'],
          ageGroups: ['adult'] as AgeGroup[],
          completionRewards: { points: 20, xp: 25 }
        }
      ]
    };

    return objectives[ageGroup] || [];
  }

  // ============ CONTENT MANAGEMENT ============

  /**
   * Add new educational fact
   */
  async addEducationalFact(fact: Omit<EducationalFact, 'id' | 'verifiedAt'>): Promise<string> {
    try {
      const newFact: Omit<EducationalFact, 'id'> = {
        ...fact,
        verifiedAt: new Date().toISOString(),
        engagementScore: 0
      };

      const docRef = await addDoc(getEducationalFactsCollection(), newFact);
      console.log('Educational fact added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding educational fact:', error);
      throw error;
    }
  }

  /**
   * Add new inspirational quote
   */
  async addInspirationalQuote(quote: Omit<InspirationalQuote, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(getInspirationalQuotesCollection(), {
        ...quote,
        userRating: 0
      });
      console.log('Inspirational quote added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding inspirational quote:', error);
      throw error;
    }
  }

  /**
   * Add new learning objective
   */
  async addLearningObjective(objective: Omit<LearningObjective, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(getLearningObjectivesCollection(), objective);
      console.log('Learning objective added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding learning objective:', error);
      throw error;
    }
  }

  // ============ SEASONAL CONTENT ============

  /**
   * Get seasonal educational content
   */
  async getSeasonalContent(ageGroup: AgeGroup, season: 'spring' | 'summer' | 'fall' | 'winter'): Promise<{
    facts: EducationalFact[];
    quotes: InspirationalQuote[];
  }> {
    try {
      // Get seasonal facts
      const factsQuery = query(
        getEducationalFactsCollection(),
        where('ageGroups', 'array-contains', ageGroup),
        where('seasonal', '==', true),
        limit(10)
      );

      const factsSnapshot = await getDocs(factsQuery);
      const facts = factsSnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as EducationalFact;
      });

      // Get seasonal quotes
      const quotesQuery = query(
        getInspirationalQuotesCollection(),
        where('ageGroups', 'array-contains', ageGroup),
        limit(5)
      );

      const quotesSnapshot = await getDocs(quotesQuery);
      const quotes = quotesSnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data } as InspirationalQuote;
      });

      return { facts, quotes };
    } catch (error) {
      console.error('Error getting seasonal content:', error);
      return { facts: [], quotes: [] };
    }
  }

  // ============ CONTENT ANALYTICS ============

  /**
   * Track content engagement
   */
  async trackContentEngagement(contentId: string, contentType: 'fact' | 'quote' | 'objective', userId: string): Promise<void> {
    try {
      // This would track user engagement with educational content
      // For now, just log the interaction
      console.log(`User ${userId} engaged with ${contentType} ${contentId}`);
      
      // In a full implementation, this would update engagement analytics
    } catch (error) {
      console.error('Error tracking content engagement:', error);
    }
  }
}

// Export singleton instance
export const educationalContentService = new EducationalContentService();