import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, safeCollection } from '../config/firebase';
import { 
  ChoreTemplate, 
  FamilyRoutine, 
  TemplateApplicationResult,
  TemplateSearchFilter,
  TemplateRecommendation,
  BulkChoreOperation,
  TemplateCustomization,
  ChoreModification
} from '../types/templates';
import { Chore, Family, FamilyMember } from '../types';
import { addChore } from './firestore';

const TEMPLATES_COLLECTION = 'choreTemplates';
const ROUTINES_COLLECTION = 'familyRoutines';
const BULK_OPERATIONS_COLLECTION = 'bulkOperations';

/**
 * Get a specific chore template by ID
 */
export async function getTemplate(templateId: string): Promise<ChoreTemplate | null> {
  try {
    const templateDoc = doc(safeCollection(TEMPLATES_COLLECTION), templateId);
    const templateSnap = await getDoc(templateDoc);
    
    if (templateSnap.exists()) {
      return { id: templateSnap.id, ...templateSnap.data() } as ChoreTemplate;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}

/**
 * Get all available templates with optional filtering
 */
export async function getTemplates(filter?: TemplateSearchFilter): Promise<ChoreTemplate[]> {
  try {
    let q = query(safeCollection(TEMPLATES_COLLECTION));
    
    // Apply basic filters
    if (filter?.isOfficial !== undefined) {
      q = query(q, where('isOfficial', '==', filter.isOfficial));
    }
    
    if (filter?.categories && filter.categories.length > 0) {
      q = query(q, where('category', 'in', filter.categories));
    }
    
    if (filter?.minRating && filter.minRating > 0) {
      q = query(q, where('rating', '>=', filter.minRating));
    }
    
    // Order by popularity and limit for performance
    q = query(q, orderBy('popularity', 'desc'), limit(50));
    
    const templatesSnap = await getDocs(q);
    let templates = templatesSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as ChoreTemplate[];
    
    // Apply client-side filters for complex criteria
    if (filter) {
      templates = applyClientSideFilters(templates, filter);
    }
    
    return templates;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

/**
 * Apply client-side filters that can't be done with Firestore queries
 */
function applyClientSideFilters(templates: ChoreTemplate[], filter: TemplateSearchFilter): ChoreTemplate[] {
  return templates.filter(template => {
    // Family size filter
    if (filter.familySize) {
      const [minSize, maxSize] = filter.familySize;
      const [templateMin, templateMax] = template.targetFamilySize;
      if (maxSize < templateMin || minSize > templateMax) {
        return false;
      }
    }
    
    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => 
        template.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // Difficulty filter
    if (filter.difficulty && filter.difficulty.length > 0) {
      if (!filter.difficulty.includes(template.difficulty)) {
        return false;
      }
    }
    
    // Time commitment filter
    if (filter.timeCommitment) {
      const [minTime, maxTime] = filter.timeCommitment;
      if (template.totalEstimatedTime < minTime || template.totalEstimatedTime > maxTime) {
        return false;
      }
    }
    
    // Text search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchableText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Create a new chore template
 */
export async function createTemplate(template: Omit<ChoreTemplate, 'id' | 'createdAt' | 'lastUpdated' | 'usageCount'>): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return null;
    }
    
    const now = new Date().toISOString();
    const newTemplate: Omit<ChoreTemplate, 'id'> = {
      ...template,
      createdBy: user.uid,
      createdAt: now,
      lastUpdated: now,
      usageCount: 0,
      popularity: 0,
      rating: 0,
      reviewCount: 0
    };
    
    const templateRef = await addDoc(safeCollection(TEMPLATES_COLLECTION), newTemplate);
    return templateRef.id;
  } catch (error) {
    console.error('Error creating template:', error);
    return null;
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(templateId: string, updates: Partial<ChoreTemplate>): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return false;
    }
    
    const templateDoc = doc(safeCollection(TEMPLATES_COLLECTION), templateId);
    const updateData = {
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: (updates.version || 0) + 1
    };
    
    await updateDoc(templateDoc, updateData);
    return true;
  } catch (error) {
    console.error('Error updating template:', error);
    return false;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user');
      return false;
    }
    
    const templateDoc = doc(safeCollection(TEMPLATES_COLLECTION), templateId);
    await deleteDoc(templateDoc);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}

/**
 * Apply a template to create chores for a family
 */
export async function applyTemplate(
  templateId: string, 
  familyId: string, 
  customizations?: TemplateCustomization,
  createRoutine: boolean = true
): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    // Get the template
    const template = await getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        choreIds: [],
        errors: ['Template not found'],
        appliedCustomizations: customizations || getDefaultCustomizations(),
        summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
      };
    }
    
    // Get family information for smart defaults
    const familyDoc = doc(safeCollection('families'), familyId);
    const familySnap = await getDoc(familyDoc);
    if (!familySnap.exists()) {
      return {
        success: false,
        choreIds: [],
        errors: ['Family not found'],
        appliedCustomizations: customizations || getDefaultCustomizations(),
        summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
      };
    }
    
    const family = familySnap.data() as Family;
    const createdChoreIds: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalPoints = 0;
    let totalTime = 0;
    
    // Apply customizations to template chores
    const finalChores = applyCustomizationsToChores(template.chores, customizations, family);
    
    // Create chores using batch for better performance
    const batch = writeBatch(safeCollection('').firestore);
    const now = new Date().toISOString();
    
    for (const templateChore of finalChores) {
      try {
        // Convert template chore to actual chore
        const choreData: Omit<Chore, 'id'> = {
          title: templateChore.title,
          description: templateChore.description,
          type: templateChore.type,
          difficulty: templateChore.difficulty,
          points: templateChore.basePoints,
          assignedTo: determineAssignee(templateChore, family, customizations),
          dueDate: calculateDueDate(templateChore),
          createdAt: now,
          createdBy: user.uid,
          familyId: familyId,
          status: 'open',
          templateId: templateId,
          recurring: templateChore.frequency ? {
            enabled: true,
            frequencyDays: templateChore.frequency
          } : undefined,
          cooldownHours: templateChore.cooldownHours,
          roomId: templateChore.room,
          category: templateChore.category,
          autoGenerated: true
        };
        
        // Create chore document reference
        const choreRef = doc(safeCollection('chores'));
        batch.set(choreRef, choreData);
        
        createdChoreIds.push(choreRef.id);
        totalPoints += choreData.points;
        totalTime += templateChore.estimatedDuration || 30; // Default 30 min estimate
        
      } catch (choreError) {
        console.error('Error creating chore from template:', choreError);
        errors.push(`Failed to create chore: ${templateChore.title}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    // Create family routine if requested
    let routineId: string | undefined;
    if (createRoutine && createdChoreIds.length > 0) {
      routineId = await createFamilyRoutine(templateId, familyId, customizations, createdChoreIds);
    }
    
    // Update template usage count
    await updateTemplateUsage(templateId);
    
    return {
      success: true,
      choreIds: createdChoreIds,
      routineId,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      appliedCustomizations: customizations || getDefaultCustomizations(),
      summary: {
        choresCreated: createdChoreIds.length,
        totalPoints,
        estimatedTotalTime: totalTime,
        nextApplication: calculateNextApplication(template, customizations)
      }
    };
    
  } catch (error) {
    console.error('Error applying template:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      appliedCustomizations: customizations || getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

/**
 * Get template recommendations for a family
 */
export async function getTemplateRecommendations(familyId: string, limit: number = 5): Promise<TemplateRecommendation[]> {
  try {
    // Get family information
    const familyDoc = doc(safeCollection('families'), familyId);
    const familySnap = await getDoc(familyDoc);
    if (!familySnap.exists()) {
      return [];
    }
    
    const family = familySnap.data() as Family;
    
    // Get all available templates
    const templates = await getTemplates({ isOfficial: true });
    
    // Score each template for this family
    const recommendations: TemplateRecommendation[] = templates.map(template => {
      const score = calculateRecommendationScore(template, family);
      return {
        template,
        score: score.totalScore,
        reasons: score.reasons,
        matchFactors: score.factors,
        customizationSuggestions: generateCustomizationSuggestions(template, family)
      };
    });
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    return [];
  }
}

/**
 * Get family routines for a specific family
 */
export async function getFamilyRoutines(familyId: string): Promise<FamilyRoutine[]> {
  try {
    const routinesQuery = query(
      safeCollection(ROUTINES_COLLECTION),
      where('familyId', '==', familyId),
      orderBy('lastApplied', 'desc')
    );
    
    const routinesSnap = await getDocs(routinesQuery);
    return routinesSnap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as FamilyRoutine[];
  } catch (error) {
    console.error('Error fetching family routines:', error);
    return [];
  }
}

/**
 * Execute bulk chore operations
 */
export async function executeBulkOperation(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    if (user.uid !== operation.requestedBy) {
      throw new Error('Unauthorized bulk operation');
    }
    
    switch (operation.operation) {
      case 'apply_template':
        if (!operation.templateId) {
          throw new Error('Template ID required for apply_template operation');
        }
        return await applyTemplate(operation.templateId, operation.familyId);
        
      case 'create_multiple':
        return await createMultipleChores(operation);
        
      case 'modify_multiple':
        return await modifyMultipleChores(operation);
        
      case 'delete_multiple':
        return await deleteMultipleChores(operation);
        
      case 'assign_multiple':
        return await assignMultipleChores(operation);
        
      case 'reschedule_multiple':
        return await rescheduleMultipleChores(operation);
        
      default:
        throw new Error(`Unsupported bulk operation: ${operation.operation}`);
    }
    
  } catch (error) {
    console.error('Error executing bulk operation:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

// Helper functions

function getDefaultCustomizations(): TemplateCustomization {
  return {
    choreModifications: [],
    memberAssignmentOverrides: [],
    pointAdjustments: [],
    scheduleOverrides: []
  };
}

function applyCustomizationsToChores(
  templateChores: any[], 
  customizations?: TemplateCustomization,
  family?: Family
): any[] {
  if (!customizations) {
    return templateChores;
  }
  
  let modifiedChores = [...templateChores];
  
  // Apply chore modifications
  customizations.choreModifications.forEach(mod => {
    if (mod.choreIndex < modifiedChores.length) {
      const chore = modifiedChores[mod.choreIndex];
      modifiedChores[mod.choreIndex] = {
        ...chore,
        ...(mod.title && { title: mod.title }),
        ...(mod.description && { description: mod.description }),
        ...(mod.points && { basePoints: mod.points }),
        ...(mod.difficulty && { difficulty: mod.difficulty }),
        ...(mod.frequency && { frequency: mod.frequency })
      };
    }
  });
  
  // Apply point adjustments
  customizations.pointAdjustments.forEach(adj => {
    if (adj.choreIndex !== undefined && adj.choreIndex < modifiedChores.length) {
      const chore = modifiedChores[adj.choreIndex];
      if (adj.multiplier) {
        chore.basePoints = Math.round(chore.basePoints * adj.multiplier);
      } else {
        chore.basePoints += adj.adjustment;
      }
    } else if (adj.choreIndex === undefined) {
      // Global adjustment
      modifiedChores = modifiedChores.map(chore => ({
        ...chore,
        basePoints: adj.multiplier 
          ? Math.round(chore.basePoints * adj.multiplier)
          : chore.basePoints + adj.adjustment
      }));
    }
  });
  
  // Remove chores marked for removal
  if (customizations.removedChores && customizations.removedChores.length > 0) {
    modifiedChores = modifiedChores.filter((_, index) => 
      !customizations.removedChores!.includes(index)
    );
  }
  
  // Add custom chores
  if (customizations.addedChores && customizations.addedChores.length > 0) {
    modifiedChores.push(...customizations.addedChores);
  }
  
  return modifiedChores;
}

function determineAssignee(templateChore: any, family: Family, customizations?: TemplateCustomization): string {
  // Check for assignment overrides
  const override = customizations?.memberAssignmentOverrides.find(
    override => override.choreIndex === templateChore.index
  );
  
  if (override) {
    return override.assignToMemberId;
  }
  
  // Default assignment logic based on template chore preferences
  const activeMembers = family.members.filter(member => member.isActive);
  
  if (templateChore.assignmentPreference === 'adult') {
    const adults = activeMembers.filter(member => member.familyRole === 'parent');
    return adults.length > 0 ? adults[0].uid : activeMembers[0]?.uid || '';
  }
  
  if (templateChore.assignmentPreference === 'child') {
    const children = activeMembers.filter(member => member.familyRole === 'child');
    return children.length > 0 ? children[0].uid : activeMembers[0]?.uid || '';
  }
  
  // Default to first active member (can be improved with rotation logic)
  return activeMembers[0]?.uid || '';
}

function calculateDueDate(templateChore: any): string {
  const now = new Date();
  
  // If chore has preferred time slots, use the next occurrence
  if (templateChore.preferredTimeSlots && templateChore.preferredTimeSlots.length > 0) {
    const slot = templateChore.preferredTimeSlots[0];
    const today = now.getDay();
    
    // Find next occurrence of preferred day
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDay = (today + dayOffset) % 7;
      if (slot.daysOfWeek.includes(targetDay)) {
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + dayOffset);
        
        // Set time if specified
        if (slot.startTime) {
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          dueDate.setHours(hours, minutes, 0, 0);
        }
        
        return dueDate.toISOString();
      }
    }
  }
  
  // Default to tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
  return tomorrow.toISOString();
}

async function createFamilyRoutine(
  templateId: string, 
  familyId: string, 
  customizations?: TemplateCustomization,
  choreIds: string[] = []
): Promise<string> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error('Template not found for routine creation');
  }
  
  const now = new Date().toISOString();
  const routine: Omit<FamilyRoutine, 'id'> = {
    familyId,
    templateId,
    name: template.name,
    customizations: customizations || getDefaultCustomizations(),
    isActive: true,
    activeChoreIds: choreIds,
    schedule: {
      type: 'weekly',
      autoApply: false
    },
    applicationCount: 1,
    lastApplied: now,
    completionRate: 0,
    averageDuration: template.totalEstimatedTime,
    createdAt: now,
    lastModified: now
  };
  
  const routineRef = await addDoc(safeCollection(ROUTINES_COLLECTION), routine);
  return routineRef.id;
}

async function updateTemplateUsage(templateId: string): Promise<void> {
  try {
    const templateDoc = doc(safeCollection(TEMPLATES_COLLECTION), templateId);
    const templateSnap = await getDoc(templateDoc);
    
    if (templateSnap.exists()) {
      const currentUsage = templateSnap.data().usageCount || 0;
      await updateDoc(templateDoc, { 
        usageCount: currentUsage + 1,
        popularity: currentUsage + 1 // Simple popularity calculation
      });
    }
  } catch (error) {
    console.error('Error updating template usage:', error);
  }
}

function calculateNextApplication(template: ChoreTemplate, customizations?: TemplateCustomization): string | undefined {
  // This would implement logic to determine when the template should be applied again
  // Based on template type and family routine schedule
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString();
}

function calculateRecommendationScore(template: ChoreTemplate, family: Family): {
  totalScore: number;
  reasons: string[];
  factors: any;
} {
  const factors = {
    familySizeMatch: 0,
    ageGroupMatch: 0,
    difficultyMatch: 0,
    timeCommitmentMatch: 0,
    categoryPreference: 0
  };
  
  const reasons: string[] = [];
  
  // Family size matching
  const familySize = family.members.length;
  const [minSize, maxSize] = template.targetFamilySize;
  if (familySize >= minSize && familySize <= maxSize) {
    factors.familySizeMatch = 100;
    reasons.push(`Perfect fit for family of ${familySize}`);
  } else {
    const sizeDiff = Math.min(Math.abs(familySize - minSize), Math.abs(familySize - maxSize));
    factors.familySizeMatch = Math.max(0, 100 - sizeDiff * 20);
  }
  
  // Difficulty matching (could be based on family experience)
  factors.difficultyMatch = template.difficulty === 'beginner' ? 80 : 60;
  
  // Simple scoring - could be enhanced with machine learning
  const totalScore = Math.round(
    (factors.familySizeMatch + factors.ageGroupMatch + factors.difficultyMatch + 
     factors.timeCommitmentMatch + factors.categoryPreference) / 5
  );
  
  return { totalScore, reasons, factors };
}

function generateCustomizationSuggestions(template: ChoreTemplate, family: Family): string[] {
  const suggestions: string[] = [];
  
  // Family size adjustments
  if (family.members.length > template.targetFamilySize[1]) {
    suggestions.push('Consider splitting some chores among multiple family members');
  }
  
  // Add more intelligent suggestions based on family composition
  const children = family.members.filter(m => m.familyRole === 'child');
  if (children.length > 2) {
    suggestions.push('Rotate chore assignments among children to keep it fair');
  }
  
  return suggestions;
}

// Helper function for default assignment
function determineDefaultAssignee(family: Family): string {
  const activeMembers = family.members.filter(member => member.isActive);
  return activeMembers[0]?.uid || '';
}

// Bulk operation implementations
async function createMultipleChores(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const createdChoreIds: string[] = [];
    const errors: string[] = [];
    let totalPoints = 0;
    let totalTime = 0;
    
    // Get family information
    const familyDoc = doc(safeCollection('families'), operation.familyId);
    const familySnap = await getDoc(familyDoc);
    if (!familySnap.exists()) {
      throw new Error('Family not found');
    }
    
    const family = familySnap.data() as Family;
    const now = new Date().toISOString();
    
    // Use batch operations for consistency
    const batch = writeBatch(safeCollection('').firestore);
    
    // Extract chore data from operation
    const choresToCreate = operation.choreData || [];
    
    for (const choreTemplate of choresToCreate) {
      try {
        const choreData: Omit<Chore, 'id'> = {
          title: choreTemplate.title,
          description: choreTemplate.description || '',
          type: choreTemplate.type || 'general',
          difficulty: choreTemplate.difficulty || 'medium',
          points: choreTemplate.points || 10,
          assignedTo: choreTemplate.assignedTo || determineDefaultAssignee(family),
          dueDate: choreTemplate.dueDate || calculateDueDate({}),
          createdAt: now,
          createdBy: user.uid,
          familyId: operation.familyId,
          status: 'open',
          recurring: choreTemplate.recurring,
          cooldownHours: choreTemplate.cooldownHours,
          roomId: choreTemplate.room,
          category: choreTemplate.category,
          autoGenerated: true
        };
        
        const choreRef = doc(safeCollection('chores'));
        batch.set(choreRef, choreData);
        
        createdChoreIds.push(choreRef.id);
        totalPoints += choreData.points;
        totalTime += 30; // Default estimate
        
      } catch (choreError) {
        console.error('Error creating chore:', choreError);
        errors.push(`Failed to create chore: ${choreTemplate.title}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      choreIds: createdChoreIds,
      errors: errors.length > 0 ? errors : undefined,
      appliedCustomizations: getDefaultCustomizations(),
      summary: {
        choresCreated: createdChoreIds.length,
        totalPoints,
        estimatedTotalTime: totalTime
      }
    };
    
  } catch (error) {
    console.error('Error in createMultipleChores:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Failed to create chores'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

async function modifyMultipleChores(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const modifiedChoreIds: string[] = [];
    const errors: string[] = [];
    let totalPointsChange = 0;
    
    // Use batch operations for consistency
    const batch = writeBatch(safeCollection('').firestore);
    
    for (const choreId of operation.choreIds) {
      try {
        const choreDoc = doc(safeCollection('chores'), choreId);
        const choreSnap = await getDoc(choreDoc);
        
        if (!choreSnap.exists()) {
          errors.push(`Chore not found: ${choreId}`);
          continue;
        }
        
        const currentChore = choreSnap.data() as Chore;
        const modifications = operation.modifications || {};
        
        // Build update data
        const updateData: Partial<Chore> = {
          lastModified: new Date().toISOString()
        };
        
        // Apply modifications
        if (modifications.points !== undefined) {
          updateData.points = modifications.points;
          totalPointsChange += modifications.points - currentChore.points;
        }
        
        if (modifications.pointsMultiplier !== undefined) {
          const newPoints = Math.round(currentChore.points * modifications.pointsMultiplier);
          updateData.points = newPoints;
          totalPointsChange += newPoints - currentChore.points;
        }
        
        if (modifications.difficulty !== undefined) {
          updateData.difficulty = modifications.difficulty;
        }
        
        if (modifications.assignTo !== undefined) {
          updateData.assignedTo = modifications.assignTo;
        }
        
        if (modifications.newDueDate !== undefined) {
          updateData.dueDate = modifications.newDueDate;
        }
        
        if (modifications.title !== undefined) {
          updateData.title = modifications.title;
        }
        
        if (modifications.description !== undefined) {
          updateData.description = modifications.description;
        }
        
        if (modifications.category !== undefined) {
          updateData.category = modifications.category;
        }
        
        batch.update(choreDoc, updateData);
        modifiedChoreIds.push(choreId);
        
      } catch (choreError) {
        console.error('Error modifying chore:', choreError);
        errors.push(`Failed to modify chore: ${choreId}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      choreIds: modifiedChoreIds,
      errors: errors.length > 0 ? errors : undefined,
      appliedCustomizations: getDefaultCustomizations(),
      summary: {
        choresCreated: 0,
        totalPoints: totalPointsChange,
        estimatedTotalTime: 0
      }
    };
    
  } catch (error) {
    console.error('Error in modifyMultipleChores:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Failed to modify chores'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

async function deleteMultipleChores(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const deletedChoreIds: string[] = [];
    const errors: string[] = [];
    let totalPointsRemoved = 0;
    
    // Use batch operations for consistency
    const batch = writeBatch(safeCollection('').firestore);
    
    for (const choreId of operation.choreIds) {
      try {
        const choreDoc = doc(safeCollection('chores'), choreId);
        const choreSnap = await getDoc(choreDoc);
        
        if (!choreSnap.exists()) {
          errors.push(`Chore not found: ${choreId}`);
          continue;
        }
        
        const choreData = choreSnap.data() as Chore;
        
        // Check permissions (only allow deletion of own chores or if admin)
        if (choreData.createdBy !== user.uid && !operation.force) {
          // Check if user is family admin
          const familyDoc = doc(safeCollection('families'), operation.familyId);
          const familySnap = await getDoc(familyDoc);
          
          if (familySnap.exists()) {
            const family = familySnap.data() as Family;
            const member = family.members.find(m => m.uid === user.uid);
            
            if (!member || member.familyRole !== 'parent') {
              errors.push(`Permission denied for chore: ${choreData.title}`);
              continue;
            }
          }
        }
        
        batch.delete(choreDoc);
        deletedChoreIds.push(choreId);
        totalPointsRemoved += choreData.points;
        
      } catch (choreError) {
        console.error('Error deleting chore:', choreError);
        errors.push(`Failed to delete chore: ${choreId}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      choreIds: deletedChoreIds,
      errors: errors.length > 0 ? errors : undefined,
      appliedCustomizations: getDefaultCustomizations(),
      summary: {
        choresCreated: 0,
        totalPoints: -totalPointsRemoved,
        estimatedTotalTime: 0
      }
    };
    
  } catch (error) {
    console.error('Error in deleteMultipleChores:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Failed to delete chores'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

async function assignMultipleChores(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const assignedChoreIds: string[] = [];
    const errors: string[] = [];
    
    // Validate assignment target
    const assignTo = operation.modifications?.assignTo;
    if (!assignTo) {
      throw new Error('No assignment target specified');
    }
    
    // Validate target member exists in family
    const familyDoc = doc(safeCollection('families'), operation.familyId);
    const familySnap = await getDoc(familyDoc);
    
    if (!familySnap.exists()) {
      throw new Error('Family not found');
    }
    
    const family = familySnap.data() as Family;
    const targetMember = family.members.find(m => 
      m.uid === assignTo || m.displayName?.toLowerCase() === assignTo.toLowerCase()
    );
    
    if (!targetMember) {
      throw new Error(`Family member not found: ${assignTo}`);
    }
    
    const targetMemberId = targetMember.uid;
    
    // Use batch operations for consistency
    const batch = writeBatch(safeCollection('').firestore);
    
    for (const choreId of operation.choreIds) {
      try {
        const choreDoc = doc(safeCollection('chores'), choreId);
        const choreSnap = await getDoc(choreDoc);
        
        if (!choreSnap.exists()) {
          errors.push(`Chore not found: ${choreId}`);
          continue;
        }
        
        const updateData = {
          assignedTo: targetMemberId,
          lastModified: new Date().toISOString()
        };
        
        batch.update(choreDoc, updateData);
        assignedChoreIds.push(choreId);
        
      } catch (choreError) {
        console.error('Error assigning chore:', choreError);
        errors.push(`Failed to assign chore: ${choreId}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      choreIds: assignedChoreIds,
      errors: errors.length > 0 ? errors : undefined,
      appliedCustomizations: getDefaultCustomizations(),
      summary: {
        choresCreated: 0,
        totalPoints: 0,
        estimatedTotalTime: 0
      }
    };
    
  } catch (error) {
    console.error('Error in assignMultipleChores:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Failed to assign chores'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}

async function rescheduleMultipleChores(operation: BulkChoreOperation): Promise<TemplateApplicationResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const rescheduledChoreIds: string[] = [];
    const errors: string[] = [];
    
    // Get new due date from modifications
    const newDueDate = operation.modifications?.newDueDate;
    if (!newDueDate) {
      throw new Error('No new due date specified');
    }
    
    // Validate the due date
    const dueDate = new Date(newDueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date format');
    }
    
    // Use batch operations for consistency
    const batch = writeBatch(safeCollection('').firestore);
    
    for (const choreId of operation.choreIds) {
      try {
        const choreDoc = doc(safeCollection('chores'), choreId);
        const choreSnap = await getDoc(choreDoc);
        
        if (!choreSnap.exists()) {
          errors.push(`Chore not found: ${choreId}`);
          continue;
        }
        
        // Calculate relative offset if needed
        let finalDueDate = newDueDate;
        if (operation.modifications?.relativeDays !== undefined) {
          const currentChore = choreSnap.data() as Chore;
          const currentDue = new Date(currentChore.dueDate);
          const newDue = new Date(currentDue);
          newDue.setDate(currentDue.getDate() + operation.modifications.relativeDays);
          finalDueDate = newDue.toISOString();
        }
        
        const updateData = {
          dueDate: finalDueDate,
          lastModified: new Date().toISOString()
        };
        
        batch.update(choreDoc, updateData);
        rescheduledChoreIds.push(choreId);
        
      } catch (choreError) {
        console.error('Error rescheduling chore:', choreError);
        errors.push(`Failed to reschedule chore: ${choreId}`);
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      choreIds: rescheduledChoreIds,
      errors: errors.length > 0 ? errors : undefined,
      appliedCustomizations: getDefaultCustomizations(),
      summary: {
        choresCreated: 0,
        totalPoints: 0,
        estimatedTotalTime: 0
      }
    };
    
  } catch (error) {
    console.error('Error in rescheduleMultipleChores:', error);
    return {
      success: false,
      choreIds: [],
      errors: [error instanceof Error ? error.message : 'Failed to reschedule chores'],
      appliedCustomizations: getDefaultCustomizations(),
      summary: { choresCreated: 0, totalPoints: 0, estimatedTotalTime: 0 }
    };
  }
}