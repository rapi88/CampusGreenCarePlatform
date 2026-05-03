// My Trees screen — list of adopted trees
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import StatusChip from '../../components/common/StatusChip';
import { relativeTime, computeHydrationStatus } from '../../utils/formatters';
import { treesApi } from '../../api/trees.api';

export default function MyTreesScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'adopted' | 'suggested'>('adopted');

  const { data: myTreesResponse, isLoading } = useQuery({
    queryKey: ['my-trees'],
    queryFn: () => treesApi.getMyTrees(),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => treesApi.leaveAdoption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trees'] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'You have left the adoption.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to leave adoption.' });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => treesApi.dismissSuggestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trees'] });
      Toast.show({ type: 'success', text1: 'Dismissed', text2: 'Suggestion dismissed.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to dismiss suggestion.' });
    }
  });

  const handleLeave = (id: string, name: string) => {
    Alert.alert('Are you sure?', `Do you want to stop caring for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate(id) }
    ]);
  };

  const handleDismiss = (id: string) => {
    Alert.alert('Dismiss', `Clear this suggestion from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dismiss', style: 'destructive', onPress: () => dismissMutation.mutate(id) }
    ]);
  };

  const adoptedTrees = myTreesResponse?.data?.adopted || [];
  const suggestedTrees = myTreesResponse?.data?.suggested || [];
  const displayData = activeTab === 'adopted' ? adoptedTrees : suggestedTrees;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🌲 My Trees</Text>
        <Text style={styles.subtitle}>{adoptedTrees.length}/10 trees adopted</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'adopted' && styles.activeTab]} 
          onPress={() => setActiveTab('adopted')}
        >
          <Text style={[styles.tabText, activeTab === 'adopted' && styles.activeTabText]}>Adopted</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'suggested' && styles.activeTab]} 
          onPress={() => setActiveTab('suggested')}
        >
          <Text style={[styles.tabText, activeTab === 'suggested' && styles.activeTabText]}>Suggested</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                if (activeTab === 'adopted' || item.status === 'ACTIVE') {
                  navigation.navigate('TreeDetail', { treeId: item.id });
                }
              }}
              disabled={activeTab === 'suggested' && item.status !== 'ACTIVE'}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardEmoji}>🌳</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {activeTab === 'adopted' ? (
                    <StatusChip status={computeHydrationStatus(item.lastWateredAt, item.wateringPeriodDays)} size="sm" />
                  ) : (
                    <StatusChip status={item.status} size="sm" />
                  )}
                </View>
                <Text style={styles.cardLoc}>📍 {item.location}</Text>
                
                {activeTab === 'adopted' && (
                  <Text style={styles.cardWatered}>💧 {item.lastWateredAt ? relativeTime(item.lastWateredAt) : 'Never'}</Text>
                )}
                
                {activeTab === 'suggested' && (
                  <Text style={styles.cardWatered}>Status: {item.status}</Text>
                )}
              </View>
              <View style={styles.cardActions}>
                {activeTab === 'adopted' ? (
                  <TouchableOpacity style={styles.leaveBtn} onPress={() => handleLeave(item.id, item.name)}>
                    <Text style={styles.leaveText}>Leave</Text>
                  </TouchableOpacity>
                ) : (
                  (item.status === 'DENIED' || item.status === 'REMOVED' || item.status === 'ACTIVE') && (
                    <TouchableOpacity style={styles.leaveBtn} onPress={() => handleDismiss(item.suggestionId || item.id)}>
                      <Text style={styles.leaveText}>Dismiss</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'adopted' ? "You haven't adopted any trees yet" : "No suggestions found"}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === 'adopted' ? "You can adopt a tree from the map screen." : "Your suggested trees will appear here."}
              </Text>
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
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.neutralDark },
  subtitle: { fontSize: 13, color: Colors.neutralMid, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: Colors.white },
  activeTab: { backgroundColor: Colors.greenPrimary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.neutralMid },
  activeTabText: { color: Colors.white },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card,
  },
  cardLeft: {
    width: 60, height: 60, backgroundColor: Colors.greenLight, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  cardEmoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark, flex: 1, marginRight: 8 },
  cardLoc: { fontSize: 12, color: Colors.neutralMid, marginBottom: 2 },
  cardWatered: { fontSize: 12, color: Colors.neutralMid },
  cardActions: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 8 },
  leaveBtn: { backgroundColor: Colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  leaveText: { color: Colors.error, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.neutralDark, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', lineHeight: 20 },
});
