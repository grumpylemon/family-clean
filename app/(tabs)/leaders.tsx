import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import UniversalIcon from '../../components/ui/UniversalIcon';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { calculateLevel } from '../../services/gamification';

export default function LeadersScreen() {
  const { family } = useFamily();
  const { user } = useAuth();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberLevel = (memberUid: string): { level: number; title: string } => {
    // For now, we'll use basic level calculation based on available data
    // In a full implementation, we'd fetch each user's profile data
    if (memberUid === user?.uid && user?.xp?.total) {
      return calculateLevel(user.xp.total);
    }
    // Default to level 1 for other members until we have their XP data
    return { level: 1, title: 'Novice Helper' };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <UniversalIcon name="trophy" size={20} color="#fbbf24" />;
      case 2:
        return <UniversalIcon name="medal" size={20} color="#9ca3af" />;
      case 3:
        return <UniversalIcon name="ribbon" size={20} color="#f97316" />;
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>;
    }
  };

  const sortedMembers = family?.members
    ? [...family.members]
        .filter(member => member.isActive)
        .sort((a, b) => (b.points?.weekly || 0) - (a.points?.weekly || 0))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fdf2f8" barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Family Leaderboards</Text>
          <Text style={styles.subtitle}>
            See who&apos;s rocking the chores, staying consistent, and earning the most points!
          </Text>
        </View>

        <View style={styles.content}>
          {/* Weekly Champions */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <UniversalIcon name="trophy" size={24} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Weekly Champions</Text>
              <UniversalIcon name="chevron-up" size={20} color="#831843" />
            </View>
            
            <View style={styles.leaderboardCard}>
              <View style={styles.leaderboardHeader}>
                <Text style={styles.columnHeader}>RANK</Text>
                <Text style={styles.columnHeader}>MEMBER</Text>
                <Text style={styles.columnHeader}>POINTS</Text>
              </View>
              
              {sortedMembers.length > 0 ? (
                sortedMembers.map((member, index) => (
                  <View key={member.uid} style={styles.memberRow}>
                    <View style={styles.rankCell}>
                      {getRankIcon(index + 1)}
                    </View>
                    <View style={styles.memberCell}>
                      <View style={styles.memberAvatar}>
                        {member.photoURL ? (
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                              {getInitials(member.name)}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                              {getInitials(member.name)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberLevel}>
                          Level {getMemberLevel(member.uid).level} - {getMemberLevel(member.uid).title}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pointsCell}>
                      <Text style={styles.points}>{member.points?.weekly || 0}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noData}>No members found</Text>
              )}
            </View>
          </View>

          {/* All-Time Legends */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <UniversalIcon name="trophy" size={24} color="#fbbf24" />
              <Text style={styles.sectionTitle}>All-Time Legends</Text>
              <UniversalIcon name="chevron-down" size={20} color="#831843" />
            </View>
          </View>

          {/* Most Consistent */}
          <View style={styles.leaderboardSection}>
            <View style={styles.sectionHeader}>
              <UniversalIcon name="flame" size={24} color="#f97316" />
              <Text style={styles.sectionTitle}>Most Consistent</Text>
              <UniversalIcon name="chevron-down" size={20} color="#831843" />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9f1239',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 20,
  },
  leaderboardSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#be185d',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 1,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  leaderboardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#be185d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9a8d4',
    marginBottom: 16,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#831843',
    flex: 1,
    textAlign: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fdf2f8',
  },
  rankCell: {
    flex: 1,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  memberCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9a8d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  memberLevel: {
    fontSize: 12,
    color: '#9f1239',
  },
  pointsCell: {
    flex: 1,
    alignItems: 'center',
  },
  points: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
  },
  noData: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9f1239',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});