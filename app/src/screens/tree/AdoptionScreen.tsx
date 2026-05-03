// Adoption screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';
import { treesApi } from '../../api/trees.api';

type Props = NativeStackScreenProps<TreeStackParamList, 'Adoption'>;

export default function AdoptionScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const queryClient = useQueryClient();

  const { data: treeResponse, isLoading } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => treesApi.getById(treeId),
  });

  const adoptMutation = useMutation({
    mutationFn: () => treesApi.adopt(treeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'You have adopted this tree!' });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to adopt the tree.' });
    }
  });

  const tree = treeResponse?.data;
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={Colors.greenPrimary} />
      </SafeAreaView>
    );
  }

  if (!tree) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={{ color: Colors.neutralMid }}>Tree not found.</Text>
      </SafeAreaView>
    );
  }

  const isFull = tree.volunteerCount >= tree.maxVolunteers;
  const isAdopted = tree.isAdopted;

  const handleAdopt = () => {
    adoptMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Adopt Tree</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.treeIcon}>🌳</Text>
        <Text style={styles.title}>{tree.name} #{tree.id.slice(-4)}</Text>
        <Text style={styles.subtitle}>Adopt this tree to receive watering reminders.</Text>

        {/* Volunteer slots summary */}
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>Volunteers ({tree.volunteerCount}/{tree.maxVolunteers})</Text>
          <View style={styles.slots}>
            {Array.from({ length: tree.maxVolunteers }).map((_, i) => {
              const isFilled = i < tree.volunteerCount;
              return (
                <View key={i} style={[styles.slot, isFilled ? styles.slotFilled : styles.slotEmpty]}>
                  {isFilled ? (
                    <Text style={styles.slotInitial}>👤</Text>
                  ) : (
                    <Text style={styles.slotPlus}>+</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>💧 Once adopted, you will get notifications when it is time to water.</Text>
          <Text style={styles.infoText}>🌿 A user can adopt multiple trees, but please commit to their care.</Text>
        </View>

        <TouchableOpacity
          style={[styles.adoptBtn, (isFull || isAdopted || adoptMutation.isPending) && styles.adoptBtnDisabled]}
          disabled={isFull || isAdopted || adoptMutation.isPending}
          onPress={handleAdopt}
        >
          {adoptMutation.isPending ? (
             <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.adoptBtnText}>
              {isAdopted ? '✅ Adopted by You' : isFull ? 'No Slots Available' : '🤝 Adopt This Tree'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  body: { flex: 1, padding: Spacing.lg, alignItems: 'center' },
  treeIcon: { fontSize: 72, marginTop: Spacing.xl, marginBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.xl },
  slotsSection: { width: '100%', marginBottom: Spacing.xl },
  slotsTitle: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark, marginBottom: Spacing.sm },
  slots: { flexDirection: 'row', gap: Spacing.sm },
  slot: { flex: 1, aspectRatio: 1, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  slotFilled: { backgroundColor: Colors.greenLight },
  slotEmpty: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.neutralLight, borderStyle: 'dashed' },
  slotInitial: { fontSize: 18, color: Colors.greenDark },
  slotPlus: { fontSize: 24, color: Colors.neutralLight },
  infoBox: { width: '100%', backgroundColor: Colors.greenLight, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xl, gap: 6 },
  infoText: { fontSize: 13, color: Colors.neutralDark, lineHeight: 20 },
  adoptBtn: {
    width: '100%', backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  adoptBtnDisabled: { backgroundColor: Colors.neutralLight },
  adoptBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
