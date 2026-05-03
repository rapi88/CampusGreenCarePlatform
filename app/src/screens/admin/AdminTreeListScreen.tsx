// Admin Tree List
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { treesApi } from '../../api/trees.api';
import { adminApi } from '../../api/admin.api';
import { computeHydrationStatus } from '../../utils/formatters';

export default function AdminTreeListScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: treesResponse, isLoading } = useQuery({
    queryKey: ['trees', 'admin'],
    queryFn: () => treesApi.getAll(), // Admins can fetch all trees, maybe filter if needed
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTree(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Deleted', text2: 'Tree deleted successfully.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete the tree.' });
    }
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Are you sure?', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) }
    ]);
  };

  const trees = treesResponse?.data || [];
  const filtered = trees.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🌳 Tree List</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminAddEditTree', {})} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput style={styles.search} placeholder="Search trees…" value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const hydration = computeHydrationStatus(item.lastWateredAt, item.wateringPeriodDays);
            return (
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSpecies}>{item.species}</Text>
                  <Text style={styles.rowLoc}>📍 {item.location}</Text>
                </View>
                <View style={styles.rowActions}>
                  <StatusChip status={hydration} size="sm" />
                  <View style={styles.actionBtns}>
                    <TouchableOpacity onPress={() => navigation.navigate('AdminAddEditTree', { treeId: item.id })} style={styles.editBtn}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>No trees found.</Text>
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
  addBtn: { backgroundColor: Colors.greenPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  searchBox: { margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.sm, ...Shadow.card },
  search: { fontSize: 15 },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  rowSpecies: { fontSize: 12, color: Colors.neutralMid, fontStyle: 'italic' },
  rowLoc: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
  rowActions: { alignItems: 'flex-end', gap: 8 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  editBtn: { backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  editText: { color: Colors.greenDark, fontWeight: '600', fontSize: 13 },
  deleteBtn: { backgroundColor: Colors.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  deleteText: { color: Colors.error, fontWeight: '600', fontSize: 13 },
});
