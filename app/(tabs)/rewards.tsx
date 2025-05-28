import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import RewardStore from '@/components/RewardStore';

export default function RewardsScreen() {
  const { user } = useAuth();
  const { family, currentMember } = useFamily();

  if (!family || !currentMember) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <Text style={styles.message}>Please join a family to access rewards.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <RewardStore 
        familyId={family.id!}
        userPoints={currentMember.points.current}
        onClose={() => {}}
        onRedemption={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 18,
    color: '#831843',
    textAlign: 'center',
    fontWeight: '600',
  },
});