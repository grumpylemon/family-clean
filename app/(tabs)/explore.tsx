import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ExploreScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <ThemedView style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>Explore</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Learn more about Family Clean</ThemedText>
        </ThemedView>
      }>
      <Collapsible title="How It Works">
        <ThemedText>
          Family Clean is designed to simplify household chore management. Each family member gets an account, and chores can be assigned, tracked, and rewarded all in one place.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Points & Rewards System">
        <ThemedText>
          When family members complete chores, they earn points based on the difficulty and importance of the task. These points can be redeemed for rewards set by the family administrator.
        </ThemedText>
        <ThemedText style={styles.listItem}>• Weekly leaderboards show top contributors</ThemedText>
        <ThemedText style={styles.listItem}>• Achievements for consistent performance</ThemedText>
        <ThemedText style={styles.listItem}>• Customizable reward options</ThemedText>
      </Collapsible>

      <Collapsible title="Family Accounts">
        <ThemedText>
          Setting up your family in the app is simple:
        </ThemedText>
        <ThemedText style={styles.listItem}>1. The parent/guardian creates a family account</ThemedText>
        <ThemedText style={styles.listItem}>2. Family members are invited via email</ThemedText>
        <ThemedText style={styles.listItem}>3. Each member gets their own personalized dashboard</ThemedText>
        <ThemedText style={styles.listItem}>4. Admins can assign chores and manage rewards</ThemedText>
      </Collapsible>

      <Collapsible title="Technical Info">
        <ThemedText>
          Family Clean is built with modern technologies:
        </ThemedText>
        <ThemedText style={styles.listItem}>• React Native & Expo for cross-platform support</ThemedText>
        <ThemedText style={styles.listItem}>• Firebase for authentication and data storage</ThemedText>
        <ThemedText style={styles.listItem}>• Google Authentication for secure login</ThemedText>
        <ThemedText style={styles.space}>
          Need help or have feedback? Contact us at:
        </ThemedText>
        <ExternalLink href="mailto:support@familyclean.app">
          support@familyclean.app
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    height: 178,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
    marginTop: 8,
  },
  listItem: {
    marginTop: 6,
    paddingLeft: 8,
  },
  space: {
    marginTop: 12,
  },
});
