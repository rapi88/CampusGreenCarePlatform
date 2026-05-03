// Admin Dashboard
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { adminApi } from '../../api/admin.api';
import { awardApi } from '../../api/award.api';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  
  const [awardUrl, setAwardUrl] = useState('');
  const [localAwardText, setLocalAwardText] = useState('');

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  });

  const { data: awardResp } = useQuery({
    queryKey: ['weeklyAward'],
    queryFn: () => awardApi.getWeeklyAward(),
  });

  useEffect(() => {
    if (awardResp?.data) {
      setAwardUrl(awardResp.data.photoUrl || '');
      setLocalAwardText(awardResp.data.text || '');
    }
  }, [awardResp]);

  const updateAwardMutation = useMutation({
    mutationFn: () => awardApi.updateWeeklyAward({
      photoUrl: awardUrl,
      text: localAwardText,
      userId: null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyAward'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Award updated!' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update award' });
    }
  });

  const stats = statsResponse?.data || {
    totalTrees: 0,
    activeVolunteers: 0,
    wateringsToday: 0,
    openIssues: 0,
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    clearAuth();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}><Text style={styles.logout}>Logout</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats grid */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.greenPrimary} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🌳</Text>
              <Text style={styles.statValue}>{stats.totalTrees || 0}</Text>
              <Text style={styles.statLabel}>Total Trees</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats.activeVolunteers || 0}</Text>
              <Text style={styles.statLabel}>Volunteers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statValue}>{stats.wateringsToday || 0}</Text>
              <Text style={styles.statLabel}>Waterings Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚠️</Text>
              <Text style={styles.statValue}>{stats.openIssues || 0}</Text>
              <Text style={styles.statLabel}>Open Issues</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* Quick actions */}
        {[
          { icon: '🌟 Tree Suggestions', screen: 'AdminTreeSuggestions', params: {} },
          { icon: '+ Add Tree', screen: 'AdminAddEditTree', params: {} },
          { icon: '🌳 Tree List', screen: 'AdminTreeList', params: {} },
          { icon: '📊 Watering Reports', screen: 'AdminReports', params: {} },
          { icon: '👥 User Management', screen: 'AdminUserManagement', params: {} },
        ].map((a) => (
          <TouchableOpacity key={a.icon} style={styles.actionBtn} onPress={() => navigation.navigate(a.screen, a.params)}>
            <Text style={styles.actionBtnText}>{a.icon}</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Award of the Week</Text>
        <View style={styles.awardBox}>
          <View style={styles.awardInputs}>
            <TextInput
              style={styles.awardInput}
              placeholder="Paste photo URL..."
              value={awardUrl}
              onChangeText={setAwardUrl}
            />
            <TextInput
              style={styles.awardInput}
              placeholder="Text on the award..."
              value={localAwardText}
              onChangeText={setLocalAwardText}
            />
          </View>
          <TouchableOpacity
            style={styles.awardSaveBtn}
            onPress={() => updateAwardMutation.mutate()}
            disabled={updateAwardMutation.isPending}
          >
            {updateAwardMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.awardSaveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

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
  awardBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  awardInputs: {
    flex: 1,
    gap: Spacing.xs,
  },
  awardInput: {
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    ...Shadow.card,
  },
  awardSaveBtn: {
    backgroundColor: Colors.greenPrimary,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  awardSaveText: { color: Colors.white, fontWeight: '600' },
});
