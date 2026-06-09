import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  const { data: suggestionsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'suggestions'],
    queryFn: () => adminApi.getSuggestions(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Suggestion approved!' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to approve suggestion.' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Suggestion rejected.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to reject suggestion.' });
    }
  });

  const suggestions = suggestionsResponse?.data || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌟 Tree Suggestions</Text>
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
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardLoc}>📍 {item.location}</Text>
                <Text style={styles.cardCoords}>Coordinates: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => approveMutation.mutate(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.rejectBtn]}
                  onPress={() => rejectMutation.mutate(item.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No pending tree suggestions.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  list: { padding: Spacing.md, gap: Spacing.sm },
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
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.neutralMid, fontSize: 15 },
});
