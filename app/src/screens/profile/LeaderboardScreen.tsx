// Leaderboard screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

const TABS = ['En Çok Sulama', 'En Düzenli'];
const MOCK_DATA = [
  { rank: 1, name: 'Mehmet Y.', initial: 'MY', score: 320 },
  { rank: 2, name: 'Zeynep K.', initial: 'ZK', score: 280 },
  { rank: 3, name: 'Ali R.', initial: 'AR', score: 245 },
  { rank: 4, name: 'Sen', initial: 'BN', score: 140, isMe: true },
  { rank: 5, name: 'Elif T.', initial: 'ET', score: 130 },
];

const rankEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}.`;

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Liderlik Tablosu</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={MOCK_DATA}
        keyExtractor={(r) => String(r.rank)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, item.isMe && styles.rowMe]}>
            <Text style={styles.rank}>{rankEmoji(item.rank)}</Text>
            <View style={[styles.avatar, item.isMe && styles.avatarMe]}>
              <Text style={[styles.avatarInitial, item.isMe && styles.avatarInitialMe]}>{item.initial}</Text>
            </View>
            <Text style={[styles.name, item.isMe && styles.nameMe]}>{item.name}</Text>
            <Text style={[styles.score, item.isMe && styles.scoreMe]}>{item.score} puan</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  tabs: { flexDirection: 'row', margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 4, ...Shadow.card },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  tabActive: { backgroundColor: Colors.greenPrimary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.neutralMid },
  tabTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
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
