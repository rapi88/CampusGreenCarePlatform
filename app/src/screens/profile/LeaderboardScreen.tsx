// Leaderboard screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { leaderboardApi } from '../../api/leaderboard.api';
import { useAuthStore } from '../../store/auth.store';

const TABS = [
  { label: 'All Time', period: 'alltime' as const },
  { label: 'Monthly', period: 'monthly' as const }
];

const rankEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}.`;

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const [tabIndex, setTabIndex] = useState(0);
  const { user } = useAuthStore();
  const currentPeriod = TABS[tabIndex].period;

  const { data: leaderboardResponse, isLoading } = useQuery({
    queryKey: ['leaderboard', currentPeriod],
    queryFn: () => leaderboardApi.getLeaderboard(currentPeriod),
  });

  const leaderboardData = leaderboardResponse?.data?.leaderboard || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t.label} style={[styles.tab, tabIndex === i && styles.tabActive]} onPress={() => setTabIndex(i)}>
            <Text style={[styles.tabText, tabIndex === i && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={leaderboardData}
          keyExtractor={(r: any) => String(r.userId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isMe = item.userId === user?.id;
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rank}>{rankEmoji(item.rank)}</Text>
                <View style={[styles.avatar, isMe && styles.avatarMe]}>
                  <Text style={[styles.avatarInitial, isMe && styles.avatarInitialMe]}>
                    {item.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={[styles.name, isMe && styles.nameMe]}>{item.name}</Text>
                <Text style={[styles.score, isMe && styles.scoreMe]}>{item.points || item.wateringCount || 0} pts</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>No leaderboard data available.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  tabs: { flexDirection: 'row', margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 4, ...Shadow.card },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.greenPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMid },
  tabTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, gap: 12, ...Shadow.card },
  rowMe: { borderWidth: 2, borderColor: Colors.greenPrimary },
  rank: { fontSize: 20, width: 32, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  avatarMe: { backgroundColor: Colors.greenPrimary },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.greenDark },
  avatarInitialMe: { color: Colors.white },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  nameMe: { color: Colors.greenDark },
  score: { fontSize: 14, fontWeight: '700', color: Colors.neutralMid },
  scoreMe: { color: Colors.greenPrimary },
});
