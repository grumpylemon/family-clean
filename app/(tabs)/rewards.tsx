import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import RewardStore from '@/components/RewardStore';

export default function RewardsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <RewardStore />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
});