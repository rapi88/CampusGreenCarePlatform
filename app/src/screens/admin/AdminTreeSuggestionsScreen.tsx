import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useMapStore } from '../../store/map.store';

export default function AdminTreeSuggestionsScreen() {
  const navigation = useNavigation<any>();
  const { suggestedTrees, approveSuggestedTree, rejectSuggestedTree } = useMapStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌟 Ağaç Önerileri</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={suggestedTrees}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardLoc}>📍 {item.location}</Text>
              <Text style={styles.cardCoords}>Koordinat: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.approveBtn]}
                onPress={() => approveSuggestedTree(item.id)}
              >
                <Text style={styles.btnText}>Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => rejectSuggestedTree(item.id)}
              >
                <Text style={styles.btnText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Bekleyen ağaç önerisi yok.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  cardInfo: { marginBottom: Spacing.sm },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  cardLoc: { fontSize: 14, color: Colors.neutralMid, marginTop: 4 },
  cardCoords: { fontSize: 12, color: Colors.neutralMid, fontFamily: 'monospace', marginTop: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: Colors.greenPrimary },
  rejectBtn: { backgroundColor: Colors.error },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.neutralMid, fontSize: 15 },
});
