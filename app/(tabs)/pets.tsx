import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import PetManagement from '../../components/PetManagement';

export default function PetsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <PetManagement />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
});