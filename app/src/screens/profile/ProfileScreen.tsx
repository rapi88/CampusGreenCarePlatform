// Profile screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';

const MENU_ITEMS = [
  { icon: '✏️', label: 'Profili Düzenle', screen: 'EditProfile' },
  { icon: '🔔', label: 'Bildirim Ayarları', screen: 'NotificationSettings' },
  { icon: '🏆', label: 'Liderlik Tablosu', screen: 'Leaderboard' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => { await AsyncStorage.removeItem('token'); clearAuth(); }
      },
    ]);
  };

  const displayName = user?.name ?? 'Kullanıcı';
  const displayEmail = user?.email ?? 'kullanici@gtu.edu.tr';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}><Text style={styles.avatarInitial}>{initial}</Text></View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.adoptedTreeIds?.length ?? 2}</Text>
            <Text style={styles.statLabel}>Ağaç Sahiplendi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>14</Text>
            <Text style={styles.statLabel}>Sulama Yapıldı</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.points ?? 140} 🏆</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  content: { padding: Spacing.md },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.greenPrimary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: Colors.white },
  name: { fontSize: 22, fontWeight: '700', color: Colors.neutralDark },
  email: { fontSize: 13, color: Colors.neutralMid, marginTop: 4 },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.neutralDark },
  statLabel: { fontSize: 11, color: Colors.neutralMid, textAlign: 'center', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: Colors.neutralLight },
  menuSection: { backgroundColor: Colors.white, borderRadius: Radius.xl, marginBottom: Spacing.md, ...Shadow.card, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralLight,
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.neutralDark, fontWeight: '500' },
  menuArrow: { fontSize: 22, color: Colors.neutralLight },
  logoutBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', ...Shadow.card,
  },
  logoutText: { fontSize: 15, color: Colors.error, fontWeight: '600' },
});
