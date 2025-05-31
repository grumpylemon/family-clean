import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoreCardCertification, UserCertificationStatus, CertificationLevel } from '../../types';
import { choreCardService } from '../../services/choreCardService';

interface Props {
  choreId: string;
  userId: string;
  certification: ChoreCardCertification;
}

const CertificationBadge: React.FC<Props> = ({
  choreId,
  userId,
  certification
}) => {
  const [certificationStatus, setCertificationStatus] = useState<UserCertificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificationStatus();
  }, [choreId, userId]);

  const loadCertificationStatus = async () => {
    try {
      setLoading(true);
      const status = await choreCardService.getCertificationStatus(userId, choreId);
      setCertificationStatus(status);
    } catch (error) {
      console.error('Error loading certification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificationPress = () => {
    const status = certificationStatus?.status || 'not_started';
    
    switch (status) {
      case 'not_started':
        Alert.alert(
          'Certification Required',
          `This task requires ${certification.level} level certification. Would you like to start the training process?`,
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Start Training', onPress: startTraining }
          ]
        );
        break;
      
      case 'in_progress':
        Alert.alert(
          'Training in Progress',
          'You are currently working on certification for this task. Continue with your assigned trainer.',
          [{ text: 'OK' }]
        );
        break;
      
      case 'expired':
        Alert.alert(
          'Certification Expired',
          'Your certification for this task has expired. You need to complete re-certification.',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Re-Certify', onPress: startRecertification }
          ]
        );
        break;
      
      case 'probation':
        Alert.alert(
          'Certification on Probation',
          'Your certification is currently under review. Please complete additional training.',
          [{ text: 'OK' }]
        );
        break;
      
      case 'certified':
        Alert.alert(
          'Certified ✅',
          `You are certified at ${certification.level} level for this task.${certificationStatus?.expiresAt ? ` Expires: ${new Date(certificationStatus.expiresAt).toLocaleDateString()}` : ''}`,
          [{ text: 'OK' }]
        );
        break;
    }
  };

  const startTraining = async () => {
    try {
      const newStatus: UserCertificationStatus = {
        choreId,
        userId,
        status: 'in_progress',
        level: certification.level,
        probationCount: 0
      };
      
      await choreCardService.updateCertificationStatus(newStatus);
      setCertificationStatus(newStatus);
      
      Alert.alert(
        'Training Started',
        'Your certification training has begun. A family trainer will be assigned to help you.',
        [{ text: 'Great!' }]
      );
    } catch (error) {
      console.error('Error starting training:', error);
      Alert.alert('Error', 'Unable to start training. Please try again.');
    }
  };

  const startRecertification = async () => {
    try {
      const updatedStatus: UserCertificationStatus = {
        ...certificationStatus!,
        status: 'in_progress'
      };
      
      await choreCardService.updateCertificationStatus(updatedStatus);
      setCertificationStatus(updatedStatus);
      
      Alert.alert(
        'Re-certification Started',
        'Your re-certification process has begun.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting re-certification:', error);
      Alert.alert('Error', 'Unable to start re-certification. Please try again.');
    }
  };

  const getBadgeStyle = () => {
    const status = certificationStatus?.status || 'not_started';
    
    switch (status) {
      case 'certified':
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#10b981',
          icon: 'shield-checkmark',
          iconColor: '#10b981',
          textColor: '#166534'
        };
      
      case 'in_progress':
        return {
          backgroundColor: '#fefce8',
          borderColor: '#f59e0b',
          icon: 'school',
          iconColor: '#f59e0b',
          textColor: '#92400e'
        };
      
      case 'expired':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          icon: 'time',
          iconColor: '#ef4444',
          textColor: '#dc2626'
        };
      
      case 'probation':
        return {
          backgroundColor: '#fdf4ff',
          borderColor: '#a855f7',
          icon: 'warning',
          iconColor: '#a855f7',
          textColor: '#7c3aed'
        };
      
      default: // not_started
        return {
          backgroundColor: '#f1f5f9',
          borderColor: '#64748b',
          icon: 'lock-closed',
          iconColor: '#64748b',
          textColor: '#475569'
        };
    }
  };

  const getBadgeText = () => {
    const status = certificationStatus?.status || 'not_started';
    const level = certification.level;
    
    switch (status) {
      case 'certified':
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Certified`;
      case 'in_progress':
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Training`;
      case 'expired':
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Expired`;
      case 'probation':
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Review`;
      default:
        return `${level.charAt(0).toUpperCase() + level.slice(1)} Required`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBadge}>
        <Text style={styles.loadingText}>Loading certification...</Text>
      </View>
    );
  }

  if (!certification.required) {
    return null;
  }

  const badgeStyle = getBadgeStyle();

  return (
    <TouchableOpacity 
      style={[
        styles.certificationBadge,
        { 
          backgroundColor: badgeStyle.backgroundColor,
          borderColor: badgeStyle.borderColor
        }
      ]}
      onPress={handleCertificationPress}
      activeOpacity={0.7}
    >
      <View style={styles.badgeContent}>
        <Ionicons 
          name={badgeStyle.icon as any} 
          size={18} 
          color={badgeStyle.iconColor} 
        />
        <View style={styles.badgeText}>
          <Text style={[styles.badgeTitle, { color: badgeStyle.textColor }]}>
            {getBadgeText()}
          </Text>
          {certification.skills && certification.skills.length > 0 && (
            <Text style={[styles.badgeSubtitle, { color: badgeStyle.textColor }]}>
              Skills: {certification.skills.join(', ')}
            </Text>
          )}
        </View>
        <Ionicons 
          name="information-circle-outline" 
          size={16} 
          color={badgeStyle.iconColor} 
        />
      </View>
      
      {certificationStatus?.status === 'certified' && certificationStatus.expiresAt && (
        <Text style={[styles.expiryText, { color: badgeStyle.textColor }]}>
          Expires: {new Date(certificationStatus.expiresAt).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  certificationBadge: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  loadingBadge: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});

export default CertificationBadge;