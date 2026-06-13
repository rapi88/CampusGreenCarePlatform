// Profile screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import ScaleButton from '../../components/common/ScaleButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { treesApi } from '../../api/trees.api';

const MENU_ITEMS = [
  { icon: '✏️', label: 'Profili Düzenle', screen: 'EditProfile' },
  { icon: '🔔', label: 'Bildirim Ayarları', screen: 'NotificationSettings' },
  { icon: '🏆', label: 'Liderlik Tablosu', screen: 'Leaderboard' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, clearAuth } = useAuthStore();

  const { data: myTreesResponse } = useQuery({
    queryKey: ['my-trees'],
    queryFn: () => treesApi.getMyTrees(),
  });

  const adoptedTreesCount = myTreesResponse?.data?.adopted?.length || 0;

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Çıkış yapmak istediğinize emin misiniz?');
      if (confirm) {
        await AsyncStorage.removeItem('token');
        clearAuth();
      }
    } else {
      Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap', style: 'destructive',
          onPress: async () => { await AsyncStorage.removeItem('token'); clearAuth(); }
        },
      ]);
    }
  };

  const displayName = user?.name ?? 'Kullanıcı';
  const displayEmail = user?.email ?? 'user@gtu.edu.tr';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar & name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{adoptedTreesCount}</Text>
            <Text style={styles.statLabel}>Sahiplenilen Ağaçlar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.totalWaterings ?? 0}</Text>
            <Text style={styles.statLabel}>Yapılan Sulamalar</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.points ?? 0} 🏆</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <ScaleButton
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </ScaleButton>
          ))}
        </View>

        {/* Logout */}
        <ScaleButton style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
        </ScaleButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  scroll: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.md, paddingBottom: 120 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.greenPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: Colors.white },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.neutralLight,
  },
  editBadgeText: { fontSize: 12 },
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
