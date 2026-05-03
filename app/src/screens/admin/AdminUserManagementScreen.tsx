// Admin User Management
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { adminApi } from '../../api/admin.api';

export default function AdminUserManagementScreen() {
  const navigation = useNavigation<any>();

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
  });

  const users = usersResponse?.data || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Users</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u: any) => u.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{item.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.meta}>🌳 {item.adoptedCount || 0} trees &nbsp; 🏆 {item.score || 0} points</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>No users found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.greenDark },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  email: { fontSize: 12, color: Colors.neutralMid },
  meta: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
});
