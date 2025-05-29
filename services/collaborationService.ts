/**
 * Collaboration Service
 * Handles help requests, trade proposals, urgency management, and collaboration notifications
 */

import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, auth, safeCollection } from '@/config/firebase';
import { 
  HelpRequest, 
  HelpRequestStatus,
  TradeProposal,
  TradeProposalStatus,
  ChoreUrgency,
  UrgencyLevel,
  CollaborationSettings,
  CollaborationNotification,
  CollaborationNotificationType,
  ChoreTradeDetails,
  Chore,
  Family
} from '@/types';

// Collection references
const getHelpRequestsCollection = () => safeCollection('helpRequests');
const getTradeProposalsCollection = () => safeCollection('tradeProposals');
const getChoreUrgencyCollection = () => safeCollection('choreUrgency');
const getCollaborationNotificationsCollection = () => safeCollection('collaborationNotifications');

// Default collaboration settings
export const DEFAULT_COLLABORATION_SETTINGS: CollaborationSettings = {
  familyId: '',
  helpRequestsEnabled: true,
  tradeProposalsEnabled: true,
  urgencySystemEnabled: true,
  choreStealingEnabled: false,
  helpRequestDefaults: {
    expirationHours: 24,
    maxActiveRequests: 3,
    minPointsSplit: 20,
    requireApprovalAbove: 100
  },
  tradeDefaults: {
    expirationHours: 48,
    maxActiveTrades: 5,
    requireAdminApproval: false,
    fairnessThreshold: 70,
    allowFutureTrades: true
  },
  urgencyDefaults: {
    normalDurationHours: 24,
    elevatedDurationHours: 12,
    highDurationHours: 6,
    stealProtectionHours: 8,
    bonusMultipliers: {
      elevated: 1.1,
      high: 1.25,
      critical: 1.5
    }
  },
  collaborationNotifications: {
    helpRequestCreated: true,
    helpRequestAccepted: true,
    tradeProposalReceived: true,
    tradeProposalResponded: true,
    choreBecomingUrgent: true,
    choreStolen: true
  },
  updatedAt: new Date().toISOString(),
  updatedBy: ''
};

// ====== HELP REQUEST SYSTEM ======

/**
 * Create a new help request
 */
export const createHelpRequest = async (
  choreId: string,
  choreTitle: string,
  request: Partial<HelpRequest>
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const helpRequestsCollection = getHelpRequestsCollection();
    if (!helpRequestsCollection) throw new Error('Collections not initialized');

    const family = await getFamilySettings(request.familyId!);
    if (!family?.collaborationSettings?.helpRequestsEnabled) {
      throw new Error('Help requests are disabled for this family');
    }

    const settings = family.collaborationSettings;
    const expirationHours = settings.helpRequestDefaults.expirationHours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const helpRequest: HelpRequest = {
      choreId,
      choreTitle,
      requesterId: user.uid,
      requesterName: user.displayName || 'Unknown',
      familyId: request.familyId!,
      type: request.type || 'assistance',
      urgency: request.urgency || 'medium',
      description: request.description || '',
      estimatedTimeNeeded: request.estimatedTimeNeeded,
      status: 'open',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      pointsSplit: request.pointsSplit || settings.helpRequestDefaults.minPointsSplit,
      xpSplit: request.xpSplit || settings.helpRequestDefaults.minPointsSplit
    };

    const docRef = await addDoc(helpRequestsCollection, helpRequest);
    
    // Create notification for family members
    await createCollaborationNotification(
      'help_request_created',
      request.familyId!,
      docRef.id,
      'help_request',
      `${user.displayName} needs help with "${choreTitle}"`
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating help request:', error);
    throw error;
  }
};

/**
 * Accept a help request
 */
export const acceptHelpRequest = async (requestId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const helpRequestsCollection = getHelpRequestsCollection();
    if (!helpRequestsCollection) throw new Error('Collections not initialized');

    const docRef = doc(helpRequestsCollection, requestId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error('Help request not found');
    }

    const request = snapshot.data() as HelpRequest;
    
    if (request.status !== 'open') {
      throw new Error('Help request is no longer available');
    }

    if (request.requesterId === user.uid) {
      throw new Error('Cannot accept your own help request');
    }

    await updateDoc(docRef, {
      helperId: user.uid,
      helperName: user.displayName || 'Unknown',
      status: 'accepted' as HelpRequestStatus,
      acceptedAt: new Date().toISOString()
    });

    // Notify the requester
    await createCollaborationNotification(
      'help_request_accepted',
      request.familyId,
      requestId,
      'help_request',
      `${user.displayName} accepted your help request for "${request.choreTitle}"`,
      request.requesterId
    );
  } catch (error) {
    console.error('Error accepting help request:', error);
    throw error;
  }
};

/**
 * Complete a help request
 */
export const completeHelpRequest = async (
  requestId: string,
  rating?: number,
  feedback?: string
): Promise<void> => {
  try {
    const helpRequestsCollection = getHelpRequestsCollection();
    if (!helpRequestsCollection) throw new Error('Collections not initialized');

    const docRef = doc(helpRequestsCollection, requestId);
    
    await updateDoc(docRef, {
      status: 'completed' as HelpRequestStatus,
      completedAt: new Date().toISOString(),
      helperRating: rating,
      helperFeedback: feedback
    });
  } catch (error) {
    console.error('Error completing help request:', error);
    throw error;
  }
};

/**
 * Get active help requests for a family
 */
export const getActiveHelpRequests = async (familyId: string): Promise<HelpRequest[]> => {
  try {
    const helpRequestsCollection = getHelpRequestsCollection();
    if (!helpRequestsCollection) return [];

    const q = query(
      helpRequestsCollection,
      where('familyId', '==', familyId),
      where('status', 'in', ['open', 'accepted']),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HelpRequest));
  } catch (error) {
    console.error('Error getting help requests:', error);
    return [];
  }
};

// ====== TRADE PROPOSAL SYSTEM ======

/**
 * Create a trade proposal
 */
export const createTradeProposal = async (
  proposal: Partial<TradeProposal>,
  offeredChores: Chore[],
  requestedChores: Chore[]
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const tradeProposalsCollection = getTradeProposalsCollection();
    if (!tradeProposalsCollection) throw new Error('Collections not initialized');

    const family = await getFamilySettings(proposal.familyId!);
    if (!family?.collaborationSettings?.tradeProposalsEnabled) {
      throw new Error('Trade proposals are disabled for this family');
    }

    const settings = family.collaborationSettings;
    const expirationHours = settings.tradeDefaults.expirationHours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Calculate fairness score
    const offeredPoints = offeredChores.reduce((sum, c) => sum + c.points, 0);
    const requestedPoints = requestedChores.reduce((sum, c) => sum + c.points, 0);
    const fairnessScore = calculateFairnessScore(offeredPoints, requestedPoints, proposal.pointsCompensation || 0);

    const tradeProposal: TradeProposal = {
      proposerId: user.uid,
      proposerName: user.displayName || 'Unknown',
      receiverId: proposal.receiverId!,
      receiverName: proposal.receiverName!,
      familyId: proposal.familyId!,
      type: proposal.type || 'one_to_one',
      status: 'pending',
      offeredChoreIds: offeredChores.map(c => c.id!),
      offeredChoreDetails: offeredChores.map(c => ({
        choreId: c.id!,
        title: c.title,
        points: c.points,
        difficulty: c.difficulty,
        dueDate: c.dueDate,
        estimatedMinutes: c.estimatedMinutes
      })),
      requestedChoreIds: requestedChores.map(c => c.id!),
      requestedChoreDetails: requestedChores.map(c => ({
        choreId: c.id!,
        title: c.title,
        points: c.points,
        difficulty: c.difficulty,
        dueDate: c.dueDate,
        estimatedMinutes: c.estimatedMinutes
      })),
      pointsCompensation: proposal.pointsCompensation,
      notes: proposal.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      fairnessScore,
      adminApprovalRequired: fairnessScore < settings.tradeDefaults.fairnessThreshold
    };

    const docRef = await addDoc(tradeProposalsCollection, tradeProposal);
    
    // Create notification for receiver
    await createCollaborationNotification(
      'trade_proposal_received',
      proposal.familyId!,
      docRef.id,
      'trade',
      `${user.displayName} wants to trade chores with you`,
      proposal.receiverId!
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating trade proposal:', error);
    throw error;
  }
};

/**
 * Respond to a trade proposal
 */
export const respondToTradeProposal = async (
  proposalId: string,
  response: 'accepted' | 'rejected',
  counterProposal?: Partial<TradeProposal>
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const tradeProposalsCollection = getTradeProposalsCollection();
    if (!tradeProposalsCollection) throw new Error('Collections not initialized');

    const docRef = doc(tradeProposalsCollection, proposalId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error('Trade proposal not found');
    }

    const proposal = snapshot.data() as TradeProposal;
    
    if (proposal.receiverId !== user.uid) {
      throw new Error('You are not the receiver of this trade proposal');
    }

    if (proposal.status !== 'pending') {
      throw new Error('Trade proposal is no longer pending');
    }

    if (response === 'accepted') {
      // Execute the trade
      await executeTradeProposal(proposalId);
      
      await updateDoc(docRef, {
        status: 'accepted' as TradeProposalStatus,
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Notify proposer
      await createCollaborationNotification(
        'trade_proposal_accepted',
        proposal.familyId,
        proposalId,
        'trade',
        `${user.displayName} accepted your trade proposal`,
        proposal.proposerId
      );
    } else {
      await updateDoc(docRef, {
        status: 'rejected' as TradeProposalStatus,
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Notify proposer
      await createCollaborationNotification(
        'trade_proposal_rejected',
        proposal.familyId,
        proposalId,
        'trade',
        `${user.displayName} rejected your trade proposal`,
        proposal.proposerId
      );
    }
  } catch (error) {
    console.error('Error responding to trade proposal:', error);
    throw error;
  }
};

/**
 * Execute a trade proposal (swap chore assignments)
 */
const executeTradeProposal = async (proposalId: string): Promise<void> => {
  try {
    const tradeProposalsCollection = getTradeProposalsCollection();
    const choresCollection = safeCollection('chores');
    
    if (!tradeProposalsCollection || !choresCollection) {
      throw new Error('Collections not initialized');
    }

    const proposalDoc = await getDoc(doc(tradeProposalsCollection, proposalId));
    const proposal = proposalDoc.data() as TradeProposal;

    // Use a batch write for atomic updates
    const batch = writeBatch(db);

    // Update offered chores (proposer -> receiver)
    for (const choreId of proposal.offeredChoreIds) {
      const choreRef = doc(choresCollection, choreId);
      batch.update(choreRef, {
        assignedTo: proposal.receiverId,
        assignedToName: proposal.receiverName,
        updatedAt: new Date().toISOString()
      });
    }

    // Update requested chores (receiver -> proposer)
    for (const choreId of proposal.requestedChoreIds) {
      const choreRef = doc(choresCollection, choreId);
      batch.update(choreRef, {
        assignedTo: proposal.proposerId,
        assignedToName: proposal.proposerName,
        updatedAt: new Date().toISOString()
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error executing trade proposal:', error);
    throw error;
  }
};

/**
 * Calculate fairness score for a trade
 */
const calculateFairnessScore = (
  offeredPoints: number,
  requestedPoints: number,
  pointsCompensation: number
): number => {
  const totalOffered = offeredPoints + (pointsCompensation > 0 ? pointsCompensation : 0);
  const totalRequested = requestedPoints + (pointsCompensation < 0 ? Math.abs(pointsCompensation) : 0);
  
  if (totalRequested === 0) return 100;
  
  const ratio = totalOffered / totalRequested;
  
  // Score is 100 when perfectly balanced, decreases as imbalance increases
  if (ratio >= 1) {
    return Math.min(100, 100 - (ratio - 1) * 50);
  } else {
    return Math.max(0, ratio * 100);
  }
};

// ====== URGENCY & STEALING SYSTEM ======

/**
 * Update chore urgency level
 */
export const updateChoreUrgency = async (
  choreId: string,
  familyId: string,
  dueDate?: Date | string
): Promise<ChoreUrgency> => {
  try {
    const choreUrgencyCollection = getChoreUrgencyCollection();
    if (!choreUrgencyCollection) throw new Error('Collections not initialized');

    const family = await getFamilySettings(familyId);
    if (!family?.collaborationSettings?.urgencySystemEnabled) {
      throw new Error('Urgency system is disabled for this family');
    }

    const settings = family.collaborationSettings.urgencyDefaults;
    const now = new Date();
    const dueDateObj = dueDate ? new Date(dueDate) : null;
    
    // Calculate urgency level based on time until due
    let urgencyLevel: UrgencyLevel = 'normal';
    let bonusMultiplier = 1.0;
    
    if (dueDateObj) {
      const hoursUntilDue = (dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDue <= 0) {
        urgencyLevel = 'critical';
        bonusMultiplier = settings.bonusMultipliers.critical;
      } else if (hoursUntilDue <= settings.highDurationHours) {
        urgencyLevel = 'high';
        bonusMultiplier = settings.bonusMultipliers.high;
      } else if (hoursUntilDue <= settings.elevatedDurationHours) {
        urgencyLevel = 'elevated';
        bonusMultiplier = settings.bonusMultipliers.elevated;
      }
    }

    // Calculate when chore becomes stealable
    const stealableAt = new Date();
    if (urgencyLevel === 'high' || urgencyLevel === 'critical') {
      stealableAt.setHours(stealableAt.getHours() + 1); // Stealable after 1 hour in high/critical
    } else {
      stealableAt.setHours(stealableAt.getHours() + settings.stealProtectionHours);
    }

    const urgencyData: ChoreUrgency = {
      choreId,
      currentLevel: urgencyLevel,
      escalatedAt: urgencyLevel !== 'normal' ? now.toISOString() : undefined,
      stealableAt: family.collaborationSettings.choreStealingEnabled ? stealableAt.toISOString() : undefined,
      bonusMultiplier,
      escalationHistory: [{
        fromLevel: 'normal',
        toLevel: urgencyLevel,
        escalatedAt: now.toISOString(),
        reason: 'time_based'
      }]
    };

    // Check if urgency record exists
    const q = query(choreUrgencyCollection, where('choreId', '==', choreId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await addDoc(choreUrgencyCollection, {
        ...urgencyData,
        escalatedAt: urgencyData.escalatedAt || undefined,
        stealableAt: urgencyData.stealableAt || undefined
      });
    } else {
      const docId = snapshot.docs[0].id;
      const existingData = snapshot.docs[0].data() as ChoreUrgency;
      
      // Only update if urgency level changed
      if (existingData.currentLevel !== urgencyLevel) {
        urgencyData.escalationHistory = [
          ...existingData.escalationHistory,
          {
            fromLevel: existingData.currentLevel,
            toLevel: urgencyLevel,
            escalatedAt: now.toISOString(),
            reason: 'time_based'
          }
        ];
        
        await updateDoc(doc(choreUrgencyCollection, docId), {
          ...urgencyData,
          escalatedAt: urgencyData.escalatedAt || undefined,
          stealableAt: urgencyData.stealableAt || undefined
        });
        
        // Send notification if urgency increased
        if (urgencyLevel !== 'normal') {
          await createCollaborationNotification(
            'chore_urgency_increased',
            familyId,
            choreId,
            'chore',
            `Chore urgency increased to ${urgencyLevel}`
          );
        }
      }
    }

    return urgencyData;
  } catch (error) {
    console.error('Error updating chore urgency:', error);
    throw error;
  }
};

/**
 * Check if a chore can be stolen
 */
export const canStealChore = async (choreId: string, familyId: string): Promise<boolean> => {
  try {
    const family = await getFamilySettings(familyId);
    if (!family?.collaborationSettings?.choreStealingEnabled) {
      return false;
    }

    const choreUrgencyCollection = getChoreUrgencyCollection();
    if (!choreUrgencyCollection) return false;

    const q = query(choreUrgencyCollection, where('choreId', '==', choreId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    const urgencyData = snapshot.docs[0].data() as ChoreUrgency;
    
    if (!urgencyData.stealableAt) return false;
    
    const now = new Date();
    const stealableTime = new Date(urgencyData.stealableAt);
    
    return now >= stealableTime;
  } catch (error) {
    console.error('Error checking steal eligibility:', error);
    return false;
  }
};

// ====== COLLABORATION SETTINGS ======

/**
 * Get family with collaboration settings
 */
const getFamilySettings = async (familyId: string): Promise<Family | null> => {
  try {
    const familiesCollection = safeCollection('families');
    if (!familiesCollection) return null;

    const familyDoc = await getDoc(doc(familiesCollection, familyId));
    if (!familyDoc.exists()) return null;

    return familyDoc.data() as Family;
  } catch (error) {
    console.error('Error getting family settings:', error);
    return null;
  }
};

/**
 * Update collaboration settings for a family
 */
export const updateCollaborationSettings = async (
  familyId: string,
  settings: Partial<CollaborationSettings>
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const familiesCollection = safeCollection('families');
    if (!familiesCollection) throw new Error('Collections not initialized');

    const baseSettings = { ...DEFAULT_COLLABORATION_SETTINGS };
    
    const updatedSettings: CollaborationSettings = {
      ...baseSettings,
      ...settings,
      familyId,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid
    };

    await updateDoc(doc(familiesCollection, familyId), {
      collaborationSettings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating collaboration settings:', error);
    throw error;
  }
};

// ====== NOTIFICATIONS ======

/**
 * Create a collaboration notification
 */
const createCollaborationNotification = async (
  type: CollaborationNotificationType,
  familyId: string,
  relatedEntityId: string,
  relatedEntityType: 'help_request' | 'trade' | 'chore',
  message: string,
  specificRecipientId?: string
): Promise<void> => {
  try {
    const notificationsCollection = getCollaborationNotificationsCollection();
    if (!notificationsCollection) return;

    const family = await getFamilySettings(familyId);
    if (!family) return;

    // Check if this notification type is enabled
    const notificationSettings = family.collaborationSettings?.collaborationNotifications;
    if (!notificationSettings) return;
    
    const notificationTypeMap: Record<CollaborationNotificationType, keyof CollaborationSettings['collaborationNotifications']> = {
      'help_request_created': 'helpRequestCreated',
      'help_request_accepted': 'helpRequestAccepted',
      'help_request_completed': 'helpRequestAccepted',
      'trade_proposal_received': 'tradeProposalReceived',
      'trade_proposal_accepted': 'tradeProposalResponded',
      'trade_proposal_rejected': 'tradeProposalResponded',
      'trade_proposal_countered': 'tradeProposalResponded',
      'chore_urgency_increased': 'choreBecomingUrgent',
      'chore_became_stealable': 'choreBecomingUrgent',
      'chore_was_stolen': 'choreStolen'
    };

    const settingKey = notificationTypeMap[type];
    if (notificationSettings && !notificationSettings[settingKey]) {
      return; // Notification type is disabled
    }

    // Create notification for specific recipient or all family members
    const recipients = specificRecipientId 
      ? [specificRecipientId] 
      : family.members.filter(m => m.isActive).map(m => m.uid);

    const notificationBase: Omit<CollaborationNotification, 'recipientId'> = {
      type,
      familyId,
      relatedEntityId,
      relatedEntityType,
      title: getNotificationTitle(type),
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Create notifications for all recipients
    const promises = recipients.map(recipientId => 
      addDoc(notificationsCollection, {
        ...notificationBase,
        recipientId
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating collaboration notification:', error);
  }
};

/**
 * Get notification title based on type
 */
const getNotificationTitle = (type: CollaborationNotificationType): string => {
  const titles: Record<CollaborationNotificationType, string> = {
    'help_request_created': 'New Help Request',
    'help_request_accepted': 'Help Request Accepted',
    'help_request_completed': 'Help Request Completed',
    'trade_proposal_received': 'New Trade Proposal',
    'trade_proposal_accepted': 'Trade Accepted',
    'trade_proposal_rejected': 'Trade Rejected',
    'trade_proposal_countered': 'Trade Counter-Offer',
    'chore_urgency_increased': 'Chore Urgency Increased',
    'chore_became_stealable': 'Chore Available to Steal',
    'chore_was_stolen': 'Chore Was Stolen'
  };
  
  return titles[type] || 'Collaboration Update';
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (userId: string): Promise<CollaborationNotification[]> => {
  try {
    const notificationsCollection = getCollaborationNotificationsCollection();
    if (!notificationsCollection) return [];

    const q = query(
      notificationsCollection,
      where('recipientId', '==', userId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CollaborationNotification));
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationsCollection = getCollaborationNotificationsCollection();
    if (!notificationsCollection) return;

    await updateDoc(doc(notificationsCollection, notificationId), {
      isRead: true,
      readAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};