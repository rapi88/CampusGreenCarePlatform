// Adoption screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import ScaleButton from '../../components/common/ScaleButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';
import { treesApi } from '../../api/trees.api';
import { useAuthStore } from '../../store/auth.store';

type Props = NativeStackScreenProps<TreeStackParamList, 'Adoption'>;

export default function AdoptionScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

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

  const leaveAdoptionMutation = useMutation({
    mutationFn: () => treesApi.leaveAdoption(treeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'You have unadopted this tree.' });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to unadopt the tree.' });
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
  const isAdoptedByMe = tree.volunteers?.some(v => v.id === user?.id) || false;

  const handleAdopt = () => {
    if (isAdoptedByMe) {
      leaveAdoptionMutation.mutate();
    } else {
      adoptMutation.mutate();
    }
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
              const volunteer = tree.volunteers?.[i];
              const isFilled = !!volunteer;
              return (
                <View key={i} style={styles.slotContainer}>
                  <View style={[styles.slot, isFilled ? styles.slotFilled : styles.slotEmpty]}>
                    {isFilled ? (
                      <Text style={styles.slotInitial}>{volunteer.name.charAt(0).toUpperCase()}</Text>
                    ) : (
                      <Text style={styles.slotPlus}>+</Text>
                    )}
                  </View>
                  {isFilled && <Text style={styles.volunteerName} numberOfLines={1}>{volunteer.name}</Text>}
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

        <ScaleButton
          style={[
            styles.adoptBtn,
            isAdoptedByMe ? styles.unadoptBtn : {},
            (adoptMutation.isPending || leaveAdoptionMutation.isPending || (isFull && !isAdoptedByMe)) && styles.adoptBtnDisabled
          ]}
          disabled={adoptMutation.isPending || leaveAdoptionMutation.isPending || (isFull && !isAdoptedByMe)}
          onPress={handleAdopt}
        >
          {adoptMutation.isPending || leaveAdoptionMutation.isPending ? (
             <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.adoptBtnText}>
              {isAdoptedByMe ? '👋 Unadopt This Tree' : isFull ? 'No Slots Available' : '🤝 Adopt This Tree'}
            </Text>
          )}
        </ScaleButton>
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
  slotContainer: { flex: 1, alignItems: 'center' },
  slot: { width: '100%', aspectRatio: 1, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  slotFilled: { backgroundColor: Colors.greenLight },
  slotEmpty: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.neutralLight, borderStyle: 'dashed' },
  slotInitial: { fontSize: 18, color: Colors.greenDark, fontWeight: 'bold' },
  slotPlus: { fontSize: 24, color: Colors.neutralLight },
  volunteerName: { fontSize: 11, color: Colors.neutralDark, marginTop: 4, textAlign: 'center' },
  infoBox: { width: '100%', backgroundColor: Colors.greenLight, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xl, gap: 6 },
  infoText: { fontSize: 13, color: Colors.neutralDark, lineHeight: 20 },
  adoptBtn: {
    width: '100%', backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  unadoptBtn: { backgroundColor: Colors.error },
  adoptBtnDisabled: { backgroundColor: Colors.neutralLight },
  adoptBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
