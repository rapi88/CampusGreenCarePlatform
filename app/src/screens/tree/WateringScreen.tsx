// GPS-verified watering screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<TreeStackParamList, 'Watering'>;

// Mock tree coordinates
const TREE_COORDS = { lat: 40.8040, lng: 29.3610 };
const THRESHOLD_M = 10;

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
  const [phase, setPhase] = useState<'checking' | 'ready' | 'far' | 'success' | 'error'>('checking');
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const scaleAnim = new Animated.Value(0);

  useEffect(() => { checkLocation(); }, []);

  const checkLocation = async () => {
    setPhase('checking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPhase('error'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const dist = haversine(loc.coords.latitude, loc.coords.longitude, TREE_COORDS.lat, TREE_COORDS.lng);
      setDistanceM(Math.round(dist));
      setPhase(dist <= THRESHOLD_M ? 'ready' : 'far');
    } catch {
      setPhase('error');
    }
  };

  const handleWater = async () => {
    setLoading(true);
    try {
      // await treesApi.water(treeId, { lat, lng });
      await new Promise((r) => setTimeout(r, 1200)); // simulate API
      setPhase('success');
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }).start();
    } catch {
      setPhase('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Ağacı Sula</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {phase === 'checking' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.greenPrimary} />
            <Text style={styles.statusText}>Konumunuz alınıyor…</Text>
          </View>
        )}

        {(phase === 'ready' || phase === 'far') && (
          <>
            <View style={[styles.distanceCard, phase === 'ready' ? styles.distCardOk : styles.distCardFar]}>
              <Text style={styles.distEmoji}>{phase === 'ready' ? '✅' : '❌'}</Text>
              <Text style={styles.distLabel}>Ağaca uzaklığınız</Text>
              <Text style={[styles.distValue, { color: phase === 'ready' ? Colors.greenDark : Colors.error }]}>
                {distanceM} metre
              </Text>
              {phase === 'far' && (
                <Text style={styles.farNote}>Sulama için ağacın yanında ({THRESHOLD_M} m içinde) olmanız gerekiyor.</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.waterBtn, phase === 'far' && styles.waterBtnDisabled]}
              disabled={phase === 'far' || loading}
              onPress={handleWater}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.waterBtnText}>🚿 Sulamayı Onayla</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}>
              <Text style={styles.retryText}>↻ Konumu Yenile</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'success' && (
          <Animated.View style={[styles.center, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.successEmoji}>🌱</Text>
            <Text style={styles.successTitle}>Teşekkürler!</Text>
            <Text style={styles.successSub}>Ağacı başarıyla suladınız.</Text>
            <View style={styles.pointsBadge}><Text style={styles.pointsText}>+10 puan 🏆</Text></View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Geri Dön</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {phase === 'error' && (
          <View style={styles.center}>
            <Text style={styles.successEmoji}>⚠️</Text>
            <Text style={styles.successTitle}>Konum alınamadı</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}><Text style={styles.retryText}>Tekrar Dene</Text></TouchableOpacity>
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
