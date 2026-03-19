// My Trees screen — list of adopted trees
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { relativeTime } from '../../utils/formatters';

const MOCK_MY_TREES = [
  { id: '1', name: 'Ak Meşe', location: 'Merkezi Avlu', status: 'needs_water' as const, lastWateredAt: new Date(Date.now() - 3 * 86400000).toISOString(), health: 'Sağlıklı' as const },
  { id: '3', name: 'Sedir #17', location: 'Mühendislik Binası', status: 'due_soon' as const, lastWateredAt: new Date(Date.now() - 86400000).toISOString(), health: 'Sağlıklı' as const },
];

export default function MyTreesScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🌲 Ağaçlarım</Text>
        <Text style={styles.subtitle}>{MOCK_MY_TREES.length}/10 ağaç sahiplenildi</Text>
      </View>

      <FlatList
        data={MOCK_MY_TREES}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TreeDetail', { treeId: item.id })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardEmoji}>🌳</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardRow}>
                <Text style={styles.cardName}>{item.name}</Text>
                <StatusChip status={item.status} size="sm" />
              </View>
              <Text style={styles.cardLoc}>📍 {item.location}</Text>
              <Text style={styles.cardWatered}>💧 {relativeTime(item.lastWateredAt)}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>Henüz ağaç sahiplenmediniz</Text>
            <Text style={styles.emptyDesc}>Harita ekranından bir ağaç sahiplenebilirsiniz.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.neutralDark },
  subtitle: { fontSize: 13, color: Colors.neutralMid, marginTop: 2 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card,
  },
  cardLeft: {
    width: 60, height: 60, backgroundColor: Colors.greenLight, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  cardEmoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark, flex: 1, marginRight: 8 },
  cardLoc: { fontSize: 12, color: Colors.neutralMid, marginBottom: 2 },
  cardWatered: { fontSize: 12, color: Colors.neutralMid },
  arrow: { fontSize: 24, color: Colors.neutralLight, marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutralDark, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', lineHeight: 20 },
});
