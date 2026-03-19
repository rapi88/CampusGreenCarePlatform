// Tree Detail Screen — matches the reference screenshot design
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { formatDate, relativeTime } from '../../utils/formatters';
import { TreeStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<TreeStackParamList, 'TreeDetail'>;

// Mock data
const MOCK_TREE = {
  id: '1', name: 'Ak Meşe', species: 'Quercus pubescens', location: 'Yıldız Parkı, Beşiktaş',
  health: 'Sağlıklı' as const, status: 'needs_water' as const,
  photoUrl: null, isNaturalMonument: true,
  lastWateredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  estimatedAge: 15, height: 12,
  plantingDate: '2009-04-22', wateringPeriodDays: 3,
  volunteerCount: 2, maxVolunteers: 4,
  lastCaretaker: { id: 'u1', name: 'Mehmet Yılmaz', badge: 'Sertifikalı Gönüllü', avatarInitial: 'MY' },
};

export default function TreeDetailScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const tree = MOCK_TREE; // Replace with: useQuery(['tree', treeId], () => treesApi.getById(treeId))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meşe Ağacı #{treeId}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImagePlaceholder}>
            <Text style={styles.heroEmoji}>🌳</Text>
          </View>
          {tree.isNaturalMonument && (
            <View style={styles.monumentBadge}>
              <Text style={styles.monumentText}>🌿 Doğal Anıt</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.treeName}>{tree.name}</Text>
            <StatusChip status={tree.health} />
          </View>
          <Text style={styles.location}>📍 {tree.location}</Text>

          {/* Last watering card */}
          <View style={styles.wateringCard}>
            <View style={styles.wateringLeft}>
              <Text style={styles.wateringIcon}>📅</Text>
              <View>
                <Text style={styles.wateringLabel}>SON SULANMA</Text>
                <Text style={styles.wateringDate}>{formatDate(tree.lastWateredAt)}</Text>
              </View>
            </View>
            <Text style={styles.wateringRelative}>{relativeTime(tree.lastWateredAt)}</Text>
          </View>

          {/* Info grid */}
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tahmini Yaş</Text>
              <Text style={styles.gridValue}>{tree.estimatedAge} Yıl</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Yükseklik</Text>
              <Text style={styles.gridValue}>{tree.height} Metre</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Sulama Periyodu</Text>
              <Text style={styles.gridValue}>{tree.wateringPeriodDays} Gün</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Gönüllüler</Text>
              <Text style={styles.gridValue}>{tree.volunteerCount}/{tree.maxVolunteers}</Text>
            </View>
          </View>

          {/* Last caretaker */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🕐</Text>
              <Text style={styles.sectionTitle}>Son Bakım Yapan</Text>
            </View>
            <View style={styles.caretakerRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{tree.lastCaretaker.avatarInitial}</Text>
              </View>
              <View style={styles.caretakerInfo}>
                <Text style={styles.caretakerName}>{tree.lastCaretaker.name}</Text>
                <Text style={styles.caretakerBadge}>{tree.lastCaretaker.badge}</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.profileLink}>Profil</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick action buttons: Chat & Notes */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Chat', { treeId, treeName: tree.name })}
            >
              <Text style={styles.quickActionEmoji}>💬</Text>
              <Text style={styles.quickActionText}>Sohbet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Notes', { treeId, treeName: tree.name })}
            >
              <Text style={styles.quickActionEmoji}>📝</Text>
              <Text style={styles.quickActionText}>Notlar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Adoption', { treeId })}
            >
              <Text style={styles.quickActionEmoji}>🤝</Text>
              <Text style={styles.quickActionText}>Sahiplen</Text>
            </TouchableOpacity>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => navigation.navigate('Watering', { treeId })}
          >
            <Text style={styles.waterBtnText}>🚿 Ağacı Sula</Text>
          </TouchableOpacity>

          {/* Secondary actions */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>⚠️ Sorun Bildir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Notes', { treeId, treeName: tree.name })}
            >
              <Text style={styles.secondaryText}>📝 Not Ekle</Text>
            </TouchableOpacity>
          </View>

          {/* Eco info */}
          <View style={styles.ecoBox}>
            <Text style={styles.ecoText}>
              ℹ️ Bu ağaç yerel ekosistemin bir parçasıdır. Sulama yaparken lütfen çevreyi kirletmemeye özen gösterin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 28, color: Colors.neutralDark, fontWeight: '300' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  moreBtn: { padding: 8 },
  moreIcon: { fontSize: 22, color: Colors.neutralDark },
  heroContainer: { position: 'relative' },
  heroImagePlaceholder: {
    height: 240, backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 80 },
  monumentBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.greenPrimary,
  },
  monumentText: { fontSize: 12, color: Colors.greenDark, fontWeight: '600' },
  body: { padding: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  treeName: { fontSize: 26, fontWeight: '700', color: Colors.neutralDark },
  location: { fontSize: 13, color: Colors.neutralMid, marginBottom: Spacing.md },
  wateringCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.greenLight, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  wateringLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wateringIcon: { fontSize: 28 },
  wateringLabel: { fontSize: 10, fontWeight: '700', color: Colors.neutralMid, letterSpacing: 0.5 },
  wateringDate: { fontSize: 18, fontWeight: '700', color: Colors.greenDark },
  wateringRelative: { fontSize: 13, color: Colors.neutralMid },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  gridCell: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, ...Shadow.card,
  },
  gridLabel: { fontSize: 11, color: Colors.neutralMid, marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  caretakerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card,
  },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarInitial: { fontSize: 16, fontWeight: '700', color: Colors.greenDark },
  caretakerInfo: { flex: 1 },
  caretakerName: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  caretakerBadge: { fontSize: 12, color: Colors.neutralMid },
  profileLink: { fontSize: 14, fontWeight: '600', color: Colors.greenPrimary },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickActionBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.sm,
    alignItems: 'center', ...Shadow.card,
  },
  quickActionEmoji: { fontSize: 22, marginBottom: 4 },
  quickActionText: { fontSize: 12, color: Colors.neutralDark, fontWeight: '500' },
  waterBtn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  waterBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  secondaryBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, height: 48,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.neutralLight,
  },
  secondaryText: { fontSize: 14, fontWeight: '500', color: Colors.neutralDark },
  ecoBox: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  ecoText: { fontSize: 12, color: Colors.neutralMid, lineHeight: 18 },
});
