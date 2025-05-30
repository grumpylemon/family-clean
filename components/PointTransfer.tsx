import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFamily , useAuth } from '@/hooks/useZustandHooks';
import { createPointTransferRequest } from '@/services/pointsService';
import { FamilyMember } from '@/types';

interface PointTransferProps {
  visible: boolean;
  onClose: () => void;
  currentUserPoints: number;
}

export const PointTransfer: React.FC<PointTransferProps> = ({
  visible,
  onClose,
  currentUserPoints,
}) => {
  const { user } = useAuth();
  const { family, currentMember } = useFamily();
  const [selectedRecipient, setSelectedRecipient] = useState<FamilyMember | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!user || !family || !selectedRecipient) return;

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (amount > currentUserPoints) {
      Alert.alert('Insufficient Points', 'You don\'t have enough points for this transfer');
      return;
    }

    if (amount > 1000) {
      Alert.alert('Transfer Limit', 'Maximum transfer amount is 1000 points per request');
      return;
    }

    setLoading(true);
    try {
      const result = await createPointTransferRequest(
        user.uid,
        selectedRecipient.uid,
        amount,
        reason || 'No reason provided',
        family.id!
      );

      if (result.success) {
        Alert.alert(
          'Transfer Request Sent',
          `Your request to transfer ${amount} points to ${selectedRecipient.name} has been sent to the family admin for approval.`,
          [{ text: 'OK', onPress: () => {
            setSelectedRecipient(null);
            setTransferAmount('');
            setReason('');
            onClose();
          }}]
        );
      } else {
        Alert.alert('Transfer Failed', result.error || 'Unable to create transfer request');
      }
    } catch (error) {
      console.error('Error creating transfer request:', error);
      Alert.alert('Transfer Failed', 'An error occurred while creating the transfer request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRecipient(null);
    setTransferAmount('');
    setReason('');
    onClose();
  };

  const eligibleMembers = family?.members.filter(member => 
    member.uid !== user?.uid && member.isActive
  ) || [];

  if (!family?.settings?.allowPointTransfers) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Point Transfers</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#831843" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.disabledContainer}>
            <Ionicons name="lock-closed" size={64} color="#9ca3af" />
            <Text style={styles.disabledTitle}>Point Transfers Disabled</Text>
            <Text style={styles.disabledText}>
              Point transfers are currently disabled for your family. 
              Ask your family admin to enable this feature in family settings.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transfer Points</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#831843" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Current Balance</Text>
            <Text style={styles.balanceAmount}>{currentUserPoints} points</Text>
          </View>

          {/* Recipient Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Recipient</Text>
            {eligibleMembers.map((member) => (
              <TouchableOpacity
                key={member.uid}
                style={[
                  styles.memberItem,
                  selectedRecipient?.uid === member.uid && styles.memberItemSelected
                ]}
                onPress={() => setSelectedRecipient(member)}
              >
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberPoints}>
                    {member.points?.current || 0} points
                  </Text>
                </View>
                <View style={styles.memberSelection}>
                  {selectedRecipient?.uid === member.uid ? (
                    <Ionicons name="radio-button-on" size={24} color="#be185d" />
                  ) : (
                    <Ionicons name="radio-button-off" size={24} color="#9ca3af" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transfer Amount</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.inputSuffix}>points</Text>
            </View>
            <Text style={styles.inputHint}>
              Maximum: {Math.min(currentUserPoints, 1000)} points
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Why are you transferring these points?"
              multiline
              numberOfLines={3}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Transfer Rules */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Transfer Rules</Text>
            <Text style={styles.rulesText}>• Maximum transfer: 1000 points per request</Text>
            <Text style={styles.rulesText}>• Transfers require admin approval</Text>
            <Text style={styles.rulesText}>• Points will be deducted once approved</Text>
            <Text style={styles.rulesText}>• Approved transfers cannot be reversed</Text>
          </View>

          {/* Transfer Button */}
          <TouchableOpacity
            style={[
              styles.transferButton,
              (!selectedRecipient || !transferAmount || loading) && styles.transferButtonDisabled
            ]}
            onPress={handleTransfer}
            disabled={!selectedRecipient || !transferAmount || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                <Text style={styles.transferButtonText}>Send Transfer Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#be185d',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  memberItemSelected: {
    borderWidth: 2,
    borderColor: '#be185d',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  memberPoints: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9f1239',
  },
  memberSelection: {
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9f1239',
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9f1239',
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rulesCard: {
    backgroundColor: '#f9a8d4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#831843',
    marginBottom: 4,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#be185d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 40,
  },
  transferButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  transferButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  disabledContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#831843',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9f1239',
    textAlign: 'center',
    lineHeight: 24,
  },
});