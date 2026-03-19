// Map screen — interactive campus tree map
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { useMapStore } from '../../store/map.store';
import { formatDistance } from '../../utils/formatters';

// --- Mock data (replace with React Query + API) ---
const MOCK_TREES = [
  { id: '1', name: 'Ak Meşe', location: 'Merkezi Avlu, Sektör A', status: 'needs_water' as const, lat: 40.804, lng: 29.361, distanceM: 20 },
  { id: '2', name: 'Kestane #042', location: 'Kütüphane Önü', status: 'watered' as const, lat: 40.805, lng: 29.362, distanceM: 150 },
  { id: '3', name: 'Sedir #17', location: 'Mühendislik Binası', status: 'due_soon' as const, lat: 40.803, lng: 29.360, distanceM: 300 },
];

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { viewMode, setViewMode, filterStatus, setFilterStatus } = useMapStore();
  const [search, setSearch] = useState('');

  const filtered = MOCK_TREES.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !filterStatus || t.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const statusDot: Record<string, string> = {
    watered: '🟢',
    needs_water: '🔴',
    due_soon: '🟠',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoEmoji}>🌳</Text>
          <Text style={styles.appName}>Tree Tracker</Text>
        </View>
        <TouchableOpacity style={styles.viewToggle} onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}>
          <Text style={styles.viewToggleText}>{viewMode === 'map' ? '☰ Liste' : '🗺️ Harita'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Yakınındaki bir ağacı bul..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.neutralMid}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true} 
        style={styles.filterScroll}
        contentContainerStyle={styles.filters}
      >
        {[null, 'watered', 'needs_water', 'due_soon'].map((s) => (
          <TouchableOpacity
            key={String(s)}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s as any)}
          >
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
              {s === null ? 'Tümü' : s === 'watered' ? '🟢 Sulandı' : s === 'needs_water' ? '🔴 Sulama Gerekli' : '🟠 Yakında'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map placeholder */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapLabel}>🗺️</Text>
            <Text style={styles.mapText}>Kampüs Haritası</Text>
            <Text style={styles.mapSubText}>(Mapbox SDK entegrasyonu)</Text>
            {/* Tree pins mock */}
            {filtered.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.mapPin, { top: 80 + i * 70, left: 60 + i * 80 }]}
                onPress={() => navigation.navigate('TreeDetail', { treeId: t.id })}
              >
                <Text style={styles.pinDot}>{statusDot[t.status]}</Text>
                <Text style={styles.pinLabel}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom preview card */}
          {filtered.length > 0 && (
            <TouchableOpacity
              style={styles.previewCard}
              onPress={() => navigation.navigate('TreeDetail', { treeId: filtered[0].id })}
            >
              <View style={styles.previewLeft}>
                <Text style={styles.previewEmoji}>🌳</Text>
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{filtered[0].name}</Text>
                <Text style={styles.previewLocation}>📍 {filtered[0].location}</Text>
                <View style={styles.previewRow}>
                  <StatusChip status={filtered[0].status} size="sm" />
                  <Text style={styles.previewDist}>{formatDistance(filtered[0].distanceM)} uzakta</Text>
                </View>
              </View>
              <Text style={styles.previewArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() => navigation.navigate('TreeDetail', { treeId: item.id })}
            >
              <View style={styles.listCardLeft}>
                <Text style={styles.listEmoji}>🌳</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listLoc}>📍 {item.location}</Text>
                <StatusChip status={item.status} size="sm" />
              </View>
              <Text style={styles.listDist}>{formatDistance(item.distanceM)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Ağaç bulunamadı</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoEmoji: { fontSize: 28 },
  appName: { fontSize: 20, fontWeight: '700', color: Colors.neutralDark },
  viewToggle: { backgroundColor: Colors.greenLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  viewToggleText: { color: Colors.greenDark, fontWeight: '600', fontSize: 13 },
  searchRow: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, height: 44, ...Shadow.card,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.neutralDark },
  filterScroll: { flexGrow: 0, marginBottom: Spacing.sm, paddingBottom: 8 },
  filters: { paddingHorizontal: Spacing.md, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.neutralLight,
  },
  filterChipActive: { backgroundColor: Colors.greenLight, borderColor: Colors.greenPrimary },
  filterText: { fontSize: 13, color: Colors.neutralMid, fontWeight: '500' },
  filterTextActive: { color: Colors.greenDark, fontWeight: '600' },
  // Map
  mapContainer: { flex: 1, position: 'relative' },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#D8EBC8', alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  mapLabel: { fontSize: 48 },
  mapText: { fontSize: 18, fontWeight: '600', color: Colors.greenDark, marginTop: 8 },
  mapSubText: { fontSize: 12, color: Colors.neutralMid, marginTop: 4 },
  mapPin: { position: 'absolute', alignItems: 'center' },
  pinDot: { fontSize: 22 },
  pinLabel: { fontSize: 10, color: Colors.neutralDark, fontWeight: '600', backgroundColor: Colors.white, paddingHorizontal: 4, borderRadius: 4, marginTop: 2 },
  previewCard: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md, right: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', ...Shadow.modal,
  },
  previewLeft: { width: 64, height: 64, backgroundColor: Colors.greenLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  previewEmoji: { fontSize: 32 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  previewLocation: { fontSize: 12, color: Colors.neutralMid, marginBottom: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewDist: { fontSize: 12, color: Colors.greenPrimary, fontWeight: '500' },
  previewArrow: { fontSize: 24, color: Colors.neutralLight },
  // List
  list: { padding: Spacing.md, gap: Spacing.sm },
  listCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card,
  },
  listCardLeft: { width: 52, height: 52, backgroundColor: Colors.greenLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  listEmoji: { fontSize: 26 },
  listInfo: { flex: 1, gap: 4 },
  listName: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  listLoc: { fontSize: 12, color: Colors.neutralMid },
  listDist: { fontSize: 12, color: Colors.greenPrimary, fontWeight: '600', marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.neutralMid },
});
