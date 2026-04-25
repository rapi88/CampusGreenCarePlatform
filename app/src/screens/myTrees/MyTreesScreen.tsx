// My Trees screen — list of adopted trees
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { relativeTime } from '../../utils/formatters';

const INITIAL_TREES = [
  { id: '1', name: 'Ak Meşe', location: 'Merkezi Avlu', status: 'needs_water' as const, lastWateredAt: new Date(Date.now() - 3 * 86400000).toISOString(), health: 'Sağlıklı' as const, missedWaterings: 0 },
  { id: '3', name: 'Sedir #17', location: 'Mühendislik Binası', status: 'due_soon' as const, lastWateredAt: new Date(Date.now() - 86400000).toISOString(), health: 'Sağlıklı' as const, missedWaterings: 0 },
];

export default function MyTreesScreen() {
  const navigation = useNavigation<any>();
  const [myTrees, setMyTrees] = useState(INITIAL_TREES);

  const handleLeave = (id: string, name: string) => {
    Alert.alert('Emin misiniz?', `${name} ağacının sorumluluğunu bırakmak istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Bırak', style: 'destructive', onPress: () => setMyTrees(prev => prev.filter(t => t.id !== id)) }
    ]);
  };

  const handleSimulateMiss = (id: string, name: string) => {
    setMyTrees(prev => prev.map(t => {
      if (t.id === id) {
        const newMissed = t.missedWaterings + 1;
        if (newMissed >= 2) {
          Alert.alert('Sorumluluk Düştü', `${name} ağacı için 2 devamsızlık yaptığınız için ağaç sorumluluğunuzdan düşürüldü.`);
          return { ...t, shouldDrop: true };
        }
        return { ...t, missedWaterings: newMissed };
      }
      return t;
    }).filter(t => !(t as any).shouldDrop));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🌲 Ağaçlarım</Text>
        <Text style={styles.subtitle}>{myTrees.length}/10 ağaç sahiplenildi</Text>
      </View>

      <FlatList
        data={myTrees}
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
              <Text style={styles.missedText}>Devamsızlık: {item.missedWaterings}/2</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.simBtn} onPress={() => handleSimulateMiss(item.id, item.name)}>
                <Text style={styles.simText}>+1 Devam</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.leaveBtn} onPress={() => handleLeave(item.id, item.name)}>
                <Text style={styles.leaveText}>Sil</Text>
              </TouchableOpacity>
            </View>
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
  missedText: { fontSize: 12, color: Colors.error, marginTop: 4, fontWeight: '500' },
  cardActions: { alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 4 },
  leaveBtn: { backgroundColor: Colors.errorLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  leaveText: { color: Colors.error, fontWeight: '700', fontSize: 12 },
  simBtn: { backgroundColor: Colors.neutralLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, marginBottom: 8 },
  simText: { color: Colors.neutralDark, fontWeight: '600', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutralDark, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', lineHeight: 20 },
});
