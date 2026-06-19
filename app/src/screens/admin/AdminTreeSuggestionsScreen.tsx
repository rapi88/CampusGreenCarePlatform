import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { adminApi } from '../../api/admin.api';

export default function AdminTreeSuggestionsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<null | { type: 'approve' | 'reject'; id: string; name: string }>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: suggestionsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'suggestions'],
    queryFn: () => adminApi.getSuggestions(),
    refetchOnMount: 'always',
    refetchInterval: 5000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveSuggestion(id),
    onSuccess: () => {
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Öneri onaylandı!' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Öneri onaylanamadı.' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectSuggestion(id, reason),
    onSuccess: () => {
      setAction(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['my-trees'] });
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Öneri reddedildi.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Öneri reddedilemedi.' });
    }
  });

  const suggestions = suggestionsResponse?.data || [];
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const openApproveModal = (id: string, name: string) => {
    setRejectReason('');
    setAction({ type: 'approve', id, name });
  };

  const openRejectModal = (id: string, name: string) => {
    setRejectReason('');
    setAction({ type: 'reject', id, name });
  };

  const closeModal = () => {
    if (isPending) return;
    setAction(null);
    setRejectReason('');
  };

  const confirmAction = () => {
    if (!action || isPending) return;

    if (action.type === 'approve') {
      approveMutation.mutate(action.id);
      return;
    }

    const reason = rejectReason.trim();
    if (!reason) {
      Toast.show({ type: 'error', text1: 'Sebep gerekli', text2: 'Lütfen reddetme sebebini yazın.' });
      return;
    }

    rejectMutation.mutate({ id: action.id, reason });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌟 Ağaç Önerileri</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(t) => t.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardLoc}>📍 {item.location}</Text>
                <Text style={styles.cardCoords}>Koordinatlar: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => openApproveModal(item.id, item.name)}
                  disabled={isPending}
                >
                  <Text style={styles.btnText}>Onayla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => openRejectModal(item.id, item.name)}
                  disabled={isPending}
                >
                  <Text style={styles.btnText}>Reddet</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Bekleyen ağaç önerisi yok.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!action}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[styles.modalIconCircle, action?.type === 'reject' && styles.modalIconCircleDanger]}>
              <Text style={styles.modalIcon}>{action?.type === 'approve' ? '✅' : '✕'}</Text>
            </View>
            <Text style={styles.modalTitle}>
              {action?.type === 'approve' ? 'Öneri onaylansın mı?' : 'Öneri reddedilsin mi?'}
            </Text>
            <Text style={styles.modalMessage}>
              {action?.name} ağacı için bu işlemi yapmak istediğinize emin misiniz?
            </Text>

            {action?.type === 'reject' && (
              <TextInput
                style={styles.reasonInput}
                placeholder="Reddetme sebebini yazın..."
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Colors.neutralMid}
                editable={!isPending}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeModal}
                disabled={isPending}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  action?.type === 'approve' ? styles.confirmApproveBtn : styles.confirmRejectBtn,
                  isPending && styles.btnDisabled,
                ]}
                onPress={confirmAction}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {action?.type === 'approve' ? 'Onayla' : 'Reddet'}
                  </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  listContainer: { flex: 1 },
  list: { flexGrow: 1, padding: Spacing.md, gap: Spacing.sm, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  cardInfo: { marginBottom: Spacing.sm },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  cardLoc: { fontSize: 14, color: Colors.neutralMid, marginTop: 4 },
  cardCoords: { fontSize: 12, color: Colors.neutralMid, fontFamily: 'monospace', marginTop: 4 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: Colors.greenPrimary },
  rejectBtn: { backgroundColor: Colors.error },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.neutralMid, fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
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
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalIconCircleDanger: { backgroundColor: '#FFEBEE' },
  modalIcon: { fontSize: 28 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.neutralDark, marginBottom: 8 },
  modalMessage: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  reasonInput: {
    width: '100%',
    minHeight: 110,
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutralLight,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.neutralDark,
    marginBottom: Spacing.md,
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
  confirmApproveBtn: { backgroundColor: Colors.greenPrimary },
  confirmRejectBtn: { backgroundColor: Colors.error },
  confirmBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
