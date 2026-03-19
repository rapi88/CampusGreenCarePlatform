// Admin User Management
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

const MOCK_USERS = [
  { id: 'u1', name: 'Mehmet Yılmaz', email: 'mehmet@gtu.edu.tr', adoptedTrees: 5, points: 320 },
  { id: 'u2', name: 'Zeynep Kaya', email: 'zeynep@gtu.edu.tr', adoptedTrees: 3, points: 280 },
  { id: 'u3', name: 'Ali Rıza', email: 'ali@gtu.edu.tr', adoptedTrees: 2, points: 245 },
];

export default function AdminUserManagementScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Kullanıcılar</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={MOCK_USERS}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.meta}>🌳 {item.adoptedTrees} ağaç &nbsp; 🏆 {item.points} puan</Text>
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
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  avatarInitial: { fontSize: 20, fontWeight: '700', color: Colors.greenDark },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  email: { fontSize: 12, color: Colors.neutralMid },
  meta: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
});
