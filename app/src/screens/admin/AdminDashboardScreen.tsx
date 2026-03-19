// Admin Dashboard
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';

const STATS = [
  { label: 'Toplam Ağaç', value: '128', icon: '🌳' },
  { label: 'Aktif Gönüllü', value: '47', icon: '👥' },
  { label: 'Bugün Sulama', value: '23', icon: '💧' },
  { label: 'Açık Sorun', value: '5', icon: '⚠️' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { clearAuth } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Admin Panel</Text>
        <TouchableOpacity onPress={clearAuth}><Text style={styles.logout}>Çıkış</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        {/* Quick actions */}
        {[
          { icon: '+ Ağaç Ekle', screen: 'AdminAddEditTree', params: {} },
          { icon: '🌳 Ağaç Listesi', screen: 'AdminTreeList', params: {} },
          { icon: '📊 Sulama Raporları', screen: 'AdminReports', params: {} },
          { icon: '👥 Kullanıcı Yönetimi', screen: 'AdminUserManagement', params: {} },
        ].map((a) => (
          <TouchableOpacity key={a.icon} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen, a.params)}>
            <Text style={styles.actionBtnText}>{a.icon}</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.white },
  title: { fontSize: 22, fontWeight: '800', color: Colors.neutralDark },
  logout: { color: Colors.error, fontWeight: '600', fontSize: 15 },
  content: { padding: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', ...Shadow.card,
  },
  statIcon: { fontSize: 28, marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800', color: Colors.neutralDark },
  statLabel: { fontSize: 12, color: Colors.neutralMid, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark, marginBottom: Spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card,
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  actionArrow: { fontSize: 22, color: Colors.neutralLight },
});
