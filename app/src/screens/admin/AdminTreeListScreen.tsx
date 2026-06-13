// Admin Tree List
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
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
  const [treeToDelete, setTreeToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: treesResponse, isLoading } = useQuery({
    queryKey: ['trees', 'admin'],
    queryFn: () => treesApi.getAll(), // Admins can fetch all trees, maybe filter if needed
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTree(id),
    onSuccess: () => {
      setTreeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Silindi', text2: 'Ağaç başarıyla silindi.' });
    },
    onError: (error) => {
      console.error('Tree delete failed:', error);
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Ağaç silinemedi.' });
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (deleteMutation.isPending) return;
    setTreeToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (!treeToDelete || deleteMutation.isPending) return;
    deleteMutation.mutate(treeToDelete.id);
  };

  const trees = treesResponse?.data || [];
  const filtered = trees.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

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

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const hydration = computeHydrationStatus(item.lastWateredAt, item.wateringPeriodDays);
            return (
              <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('TreeDetail', { treeId: item.id })}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSpecies}>{item.species}</Text>
                  <Text style={styles.rowLoc}>📍 {item.location}</Text>
                </View>
                <View style={styles.rowActions}>
                  <StatusChip status={hydration} size="sm" />
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        navigation.navigate('AdminAddEditTree', { treeId: item.id });
                      }}
                      style={styles.editBtn}
                    >
                      <Text style={styles.editText}>Düzenle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id, item.name);
                      }}
                      style={[styles.deleteBtn, deleteMutation.isPending && styles.deleteBtnDisabled]}
                      disabled={deleteMutation.isPending}
                    >
                      <Text style={styles.deleteText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>Ağaç bulunamadı.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!treeToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteMutation.isPending && setTreeToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIcon}>🗑️</Text>
            </View>
            <Text style={styles.modalTitle}>Ağaç silinsin mi?</Text>
            <Text style={styles.modalMessage}>
              {treeToDelete?.name} ağacını listeden kaldırmak istediğinize emin misiniz?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setTreeToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn, deleteMutation.isPending && styles.deleteBtnDisabled]}
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.confirmBtnText}>Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  listContainer: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: 120 },
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
  deleteBtnDisabled: { opacity: 0.5 },
  deleteText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.modal,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalIcon: { fontSize: 28 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.neutralDark, marginBottom: 8 },
  modalMessage: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { backgroundColor: Colors.neutralBg },
  cancelBtnText: { color: Colors.neutralDark, fontWeight: '700', fontSize: 15 },
  confirmBtn: { backgroundColor: Colors.error },
  confirmBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
