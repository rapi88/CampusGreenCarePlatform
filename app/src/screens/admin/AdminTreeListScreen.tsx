// Admin Tree List
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';

const MOCK = [
  { id: '1', name: 'Ak Meşe', species: 'Quercus pubescens', location: 'Merkezi Avlu', status: 'needs_water' as const },
  { id: '2', name: 'Kestane #042', species: 'Castanea sativa', location: 'Kütüphane', status: 'watered' as const },
  { id: '3', name: 'Sedir #17', species: 'Cedrus libani', location: 'Müh. Binası', status: 'due_soon' as const },
];

export default function AdminTreeListScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const filtered = MOCK.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🌳 Ağaç Listesi</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminAddEditTree', {})} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Ekle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput style={styles.search} placeholder="Ağaç ara…" value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowSpecies}>{item.species}</Text>
              <Text style={styles.rowLoc}>📍 {item.location}</Text>
            </View>
            <View style={styles.rowActions}>
              <StatusChip status={item.status} size="sm" />
              <TouchableOpacity onPress={() => navigation.navigate('AdminAddEditTree', { treeId: item.id })} style={styles.editBtn}>
                <Text style={styles.editText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
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
  addBtn: { backgroundColor: Colors.greenPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  searchBox: { margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.sm, ...Shadow.card },
  search: { fontSize: 15 },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  rowSpecies: { fontSize: 12, color: Colors.neutralMid, fontStyle: 'italic' },
  rowLoc: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
  rowActions: { alignItems: 'flex-end', gap: 8 },
  editBtn: { backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  editText: { color: Colors.greenDark, fontWeight: '600', fontSize: 13 },
});
