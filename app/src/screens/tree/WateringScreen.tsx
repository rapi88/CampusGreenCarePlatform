// GPS-verified watering screen
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import ScaleButton from '../../components/common/ScaleButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';
import { treesApi } from '../../api/trees.api';

type Props = NativeStackScreenProps<TreeStackParamList, 'Watering'>;

const THRESHOLD_M = 200; // Expanded to 200m for easier testing, in prod you might want 10m

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WateringScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<'checking' | 'ready' | 'far' | 'success' | 'error'>('checking');
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const scaleAnim = new Animated.Value(0);

  const { data: treeResponse } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => treesApi.getById(treeId),
  });
  
  const treeCoords = useMemo(() => {
    return treeResponse?.data ? { lat: treeResponse.data.latitude, lng: treeResponse.data.longitude } : null;
  }, [treeResponse?.data?.latitude, treeResponse?.data?.longitude]);

  const waterMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) => treesApi.water(treeId, coords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      setPhase('success');
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    },
    onError: () => {
      setPhase('error');
    }
  });

  useEffect(() => {
    if (treeCoords) {
      checkLocation();
    }
  }, [treeCoords]);

  const checkLocation = async () => {
    if (!treeCoords) return;
    setPhase('checking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPhase('error'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const dist = haversine(loc.coords.latitude, loc.coords.longitude, treeCoords.lat, treeCoords.lng);
      setDistanceM(Math.round(dist));
      setPhase(dist <= THRESHOLD_M ? 'ready' : 'far');
    } catch {
      setPhase('error');
    }
  };

  const handleWater = () => {
    if (currentCoords) {
      waterMutation.mutate(currentCoords);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Water Tree</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {phase === 'checking' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.greenPrimary} />
            <Text style={styles.statusText}>Checking location…</Text>
          </View>
        )}

        {(phase === 'ready' || phase === 'far') && (
          <>
            <View style={[styles.distanceCard, phase === 'ready' ? styles.distCardOk : styles.distCardFar]}>
              <Text style={styles.distEmoji}>{phase === 'ready' ? '✅' : '❌'}</Text>
              <Text style={styles.distLabel}>Distance to tree</Text>
              <Text style={[styles.distValue, { color: phase === 'ready' ? Colors.greenDark : Colors.error }]}>
                {distanceM} meters
              </Text>
              {phase === 'far' && (
                <Text style={styles.farNote}>You need to be closer to the tree (within {THRESHOLD_M} m) to water it.</Text>
              )}
            </View>

            <ScaleButton
              style={[styles.waterBtn, phase === 'far' && styles.waterBtnDisabled]}
              disabled={phase === 'far' || waterMutation.isPending}
              onPress={handleWater}
            >
              {waterMutation.isPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.waterBtnText}>🚿 Confirm Watering</Text>
              }
            </ScaleButton>

            <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}>
              <Text style={styles.retryText}>↻ Refresh Location</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'success' && (
          <Animated.View style={[styles.center, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.successEmoji}>🌱</Text>
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successSub}>You have successfully watered the tree.</Text>
            <View style={styles.pointsBadge}><Text style={styles.pointsText}>+10 points 🏆</Text></View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Go Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {phase === 'error' && (
          <View style={styles.center}>
            <Text style={styles.successEmoji}>⚠️</Text>
            <Text style={styles.successTitle}>Could not get location</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}><Text style={styles.retryText}>Try Again</Text></TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  body: { flex: 1, padding: Spacing.lg, justifyContent: 'center' },
  center: { alignItems: 'center' },
  statusText: { marginTop: Spacing.md, fontSize: 16, color: Colors.neutralMid },
  distanceCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  distCardOk: { backgroundColor: Colors.greenLight },
  distCardFar: { backgroundColor: '#FFEBEE' },
  distEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  distLabel: { fontSize: 14, color: Colors.neutralMid, marginBottom: 4 },
  distValue: { fontSize: 36, fontWeight: '700', marginBottom: Spacing.sm },
  farNote: { fontSize: 13, color: Colors.neutralMid, textAlign: 'center', lineHeight: 18 },
  waterBtn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md, height: 56,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  waterBtnDisabled: { backgroundColor: Colors.neutralLight },
  waterBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  retryBtn: { alignItems: 'center', padding: Spacing.sm },
  retryText: { color: Colors.greenPrimary, fontSize: 15, fontWeight: '600' },
  successEmoji: { fontSize: 72, marginBottom: Spacing.md },
  successTitle: { fontSize: 28, fontWeight: '700', color: Colors.neutralDark, textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 15, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.lg },
  pointsBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full, marginBottom: Spacing.xl },
  pointsText: { fontSize: 16, fontWeight: '700', color: '#F57F17' },
  doneBtn: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.md, height: 52, width: 200, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
