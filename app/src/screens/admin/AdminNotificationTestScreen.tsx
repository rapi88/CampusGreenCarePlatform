// Admin Notification Test Center
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { debugApi } from '../../api/debug.api';
import { treesApi, Tree } from '../../api/trees.api';
import ScaleButton from '../../components/common/ScaleButton';

export default function AdminNotificationTestScreen() {
  const navigation = useNavigation<any>();
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [showTreePicker, setShowTreePicker] = useState(false);
  const [localPending, setLocalPending] = useState(false);

  const { data: statusResp, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['debug', 'token-status'],
    queryFn: () => debugApi.getTokenStatus(),
  });

  const { data: treesResp } = useQuery({
    queryKey: ['trees'],
    queryFn: () => treesApi.getAll(),
  });

  const status = statusResp?.data;
  const trees = treesResp?.data ?? [];

  const selfTestMutation = useMutation({
    mutationFn: () => debugApi.sendSelfTest(),
    onSuccess: (res) => Toast.show({ type: 'success', text1: '✅ Gönderildi', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.response?.data?.message ?? 'Hata' }),
  });

  const reminderSelfMutation = useMutation({
    mutationFn: () => {
      if (!selectedTree) throw new Error('Once bir ağaç seçin');
      return debugApi.sendWateringReminder(selectedTree.id, true);
    },
    onSuccess: (res) => Toast.show({ type: 'success', text1: '💧 Gönderildi', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.response?.data?.message ?? 'Once bir ağaç seçin' }),
  });

  const reminderAdoptersMutation = useMutation({
    mutationFn: () => {
      if (!selectedTree) throw new Error('Once bir ağaç seçin');
      return debugApi.sendWateringReminder(selectedTree.id, false);
    },
    onSuccess: (res) => Toast.show({ type: 'success', text1: '💧 Sahiplenenlere Gönderildi', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.response?.data?.message ?? 'Once bir ağaç seçin' }),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => debugApi.broadcastTest(),
    onSuccess: (res) => {
      const d = res.data;
      const type = d.rejected > 0 && d.accepted === 0 ? 'error' : 'success';
      Toast.show({ type, text1: '📢 Toplu Gönderim Sonucu', text2: d.message });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.response?.data?.message ?? 'Hata' }),
  });

  const cronMutation = useMutation({
    mutationFn: () => debugApi.triggerCron(),
    onSuccess: (res) => Toast.show({ type: 'success', text1: '🔄 Cron Çalıştırildi', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.response?.data?.message ?? 'Hata' }),
  });

  const anyPending = selfTestMutation.isPending || reminderSelfMutation.isPending ||
    reminderAdoptersMutation.isPending || broadcastMutation.isPending || cronMutation.isPending || localPending;

  const sendLocalNotification = async (title: string, body: string, data?: Record<string, any>) => {
    setLocalPending(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'İzin reddedildi', text2: 'Ayarlardan bildirimlere izin verin.' });
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: data ?? {}, sound: true },
        trigger: null, // fire immediately
      });
      Toast.show({ type: 'success', text1: '✅ Yerel bildirim gönderildi', text2: 'Bildirim bandinizi kontrol edin.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Başarısız', text2: e?.message ?? 'Hata' });
    } finally {
      setLocalPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Bildirim Test Merkezi</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Token Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Push Token Altyapisi</Text>
            <TouchableOpacity onPress={() => refetchStatus()}>
              <Text style={styles.refreshText}>↻ Yenile</Text>
            </TouchableOpacity>
          </View>
          {statusLoading ? (
            <ActivityIndicator color={Colors.greenPrimary} style={{ marginTop: 8 }} />
          ) : status ? (
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.registered}</Text>
                <Text style={styles.statusSub}>Kayıtli Token</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.unregistered}</Text>
                <Text style={styles.statusSub}>Token Yok</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: status.adminTokenRegistered ? Colors.greenPrimary : Colors.error }]}>
                  {status.adminTokenRegistered ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusSub}>Sizin Tokeniniz</Text>
              </View>
            </View>
          ) : null}
          {status && !status.adminTokenRegistered && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Cihazınızda kayıtlı push token yok. Uygulamayı yeniden başlatın ve bildirim izinlerine onay verin.
              </Text>
            </View>
          )}
        </View>

        {/* Simulator / Local notification section — works without projectId */}
        {Platform.OS !== 'web' && (
          <View style={[styles.section, styles.sectionSimulator]}>
            <Text style={styles.sectionTitle}>📱 Yerel Bildirim Testi</Text>
            <Text style={styles.sectionDesc}>
              Simulator ve gerçek cihazlarda Expo project ID veya push token olmadan çalışır. Bildirim dogrudan bu cihaza iletilir.
            </Text>
            <ScaleButton
              style={[styles.actionBtn, anyPending && styles.btnDisabled]}
              onPress={() => sendLocalNotification('🧪 Test Bildirimi', 'Yerel bildirimler dogru calisiyor!', { type: 'local_test' })}
              disabled={anyPending}
            >
              {localPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.actionBtnText}>📲 Yerel Test Bildirimi Gönder</Text>}
            </ScaleButton>
            <ScaleButton
              style={[styles.actionBtn, styles.actionBtnSeçondary, anyPending && styles.btnDisabled]}
              onPress={() => sendLocalNotification(
                '💧 Sulama Zamanı!',
                `${selectedTree ? selectedTree.name : 'Test Ağacı'} ağacının sulanma zamanı geldi! 🌳`,
                { type: 'watering_reminder' }
              )}
              disabled={anyPending}
            >
              {localPending
                ? <ActivityIndicator color={Colors.greenPrimary} />
                : <Text style={[styles.actionBtnText, { color: Colors.greenPrimary }]}>
                    💧 Sulama Hatırlatıcısı Simüle Et{selectedTree ? ` (${selectedTree.name})` : ''}
                  </Text>}
            </ScaleButton>
            <View style={styles.simulatorNote}>
              <Text style={styles.simulatorNoteText}>
                ℹ️ Uzaktan push bildirimlerini etkinleştirmek için şunu çalıştırin:{'\n'}
                <Text style={styles.code}>npx eas init</Text>
                {'\n'}ardindan yazdirilan UUID'yi app/.env içindeki EXPO_PROJECT_ID alanina ekleyip yeniden build alın.
              </Text>
            </View>
          </View>
        )}

        {/* Section 1: Self Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1️⃣ Genel Push Testi</Text>
          <Text style={styles.sectionDesc}>Kendi cihazınıza test bildirimi göndererek tüm push akışını doğrulayın.</Text>
          <ScaleButton
            style={[styles.actionBtn, selfTestMutation.isPending && styles.btnDisabled]}
            onPress={() => selfTestMutation.mutate()}
            disabled={anyPending}
          >
            {selfTestMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>📨 Cihazima Test Push Gönder</Text>}
          </ScaleButton>
        </View>

        {/* Section 2: Watering Reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ Sulama Hatırlatıcısı</Text>
          <Text style={styles.sectionDesc}>Belirli bir ağaç için sulama hatırlatıcısi bildirimini simüle edin.</Text>

          {/* Tree picker */}
          <TouchableOpacity
            style={styles.treePicker}
            onPress={() => setShowTreePicker(!showTreePicker)}
          >
            <Text style={styles.treePickerText}>
              {selectedTree ? `🌳 ${selectedTree.name}` : 'Ağaç seçmek için dokunun →'}
            </Text>
          </TouchableOpacity>

          {showTreePicker && (
            <FlatList
              data={trees.slice(0, 20)}
              keyExtractor={(t) => t.id}
              style={styles.treeList}
              nestedScrollEnabled
              scrollEnabled
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.treeItem, selectedTree?.id === item.id && styles.treeItemSelected]}
                  onPress={() => { setSelectedTree(item); setShowTreePicker(false); }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.treeItemName}>{item.name}</Text>
                  <Text style={styles.treeItemLoc}>📍 {item.location}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: Spacing.md }}>
                  <Text style={{ color: Colors.neutralMid, textAlign: 'center' }}>Ağaç bulunamadı</Text>
                </View>
              }
            />
          )}

          <ScaleButton
            style={[styles.actionBtn, (!selectedTree || anyPending) && styles.btnDisabled]}
            onPress={() => reminderSelfMutation.mutate()}
            disabled={!selectedTree || anyPending}
          >
            {reminderSelfMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>💧 Hatırlatıcıyı Cihazima Gönder</Text>}
          </ScaleButton>

          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnSeçondary, (!selectedTree || anyPending) && styles.btnDisabled]}
            onPress={() => reminderAdoptersMutation.mutate()}
            disabled={!selectedTree || anyPending}
          >
            {reminderAdoptersMutation.isPending
              ? <ActivityIndicator color={Colors.greenPrimary} />
              : <Text style={[styles.actionBtnText, { color: Colors.greenPrimary }]}>💧 Ağacı Sahiplenen Herkese Gönder</Text>}
          </ScaleButton>
        </View>

        {/* Section 3: Broadcast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3️⃣ Tüm Kullanıcılara Toplu Gönderim</Text>
          <Text style={styles.sectionDesc}>Kayıtli push tokeni olan her kullanıcıya test bildirimi gönderin.</Text>
          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnWarning, anyPending && styles.btnDisabled]}
            onPress={() => broadcastMutation.mutate()}
            disabled={anyPending}
          >
            {broadcastMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>📢 Tüm Kullanıcılara Test Gönder</Text>}
          </ScaleButton>

          {/* Show broadcast result details */}
          {broadcastMutation.data && (
            <View style={styles.resultBox}>
              {(['usersFound','validTokens','accepted','rejected'] as const).map((k) => (
                <View key={k} style={styles.resultRow}>
                  <Text style={styles.resultKey}>{k}</Text>
                  <Text style={[styles.resultVal, k === 'rejected' && (broadcastMutation.data!.data as any)[k] > 0 && { color: Colors.error }]}>
                    {(broadcastMutation.data!.data as any)[k]}
                  </Text>
                </View>
              ))}
              {((broadcastMutation.data.data as any).errors ?? []).map((e: any, i: number) => (
                <View key={i} style={styles.errorRow}>
                  <Text style={styles.errorText}>❌ {e.message}</Text>
                  {e.details?.error && <Text style={styles.errorCode}>{e.details.error}</Text>}
                </View>
              ))}
              <Text style={styles.hintText}>{(broadcastMutation.data.data as any).hint}</Text>
            </View>
          )}

            </View>
          )}
        </View>

        {/* Section 4: Trigger Cron */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4️⃣ Günluk Cron Gorevini Çalıştır</Text>
          <Text style={styles.sectionDesc}>
            Geciken tüm ağaçlari kontrol edip sahiplenenlere sulama hatırlatıcısi gönderen zamanlayıcıyı elle çalıştırin. Normalde her gün 08:00'de çalışır.
          </Text>
          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnNeutral, anyPending && styles.btnDisabled]}
            onPress={() => cronMutation.mutate()}
            disabled={anyPending}
          >
            {cronMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>🔄 Günluk Cron'u Simdi Çalıştır</Text>}
          </ScaleButton>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            ℹ️ Bu panel yalnızca uygulama ortamında EXPO_PUBLIC_NOTIFICATION_DEBUG=true iken görünür. Production yayından önce devre dışı bırakın.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  content: { flexGrow: 1, padding: Spacing.md, gap: Spacing.md, paddingBottom: 120 },

  // Status card
  statusCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  statusLabel: { fontSize: 14, fontWeight: '700', color: Colors.neutralDark },
  refreshText: { fontSize: 13, color: Colors.greenPrimary, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statusItem: { alignItems: 'center' },
  statusValue: { fontSize: 22, fontWeight: '800', color: Colors.neutralDark },
  statusSub: { fontSize: 11, color: Colors.neutralMid, marginTop: 2, textAlign: 'center' },
  warningBox: {
    backgroundColor: '#FFF8E1', borderRadius: Radius.md, padding: Spacing.sm,
    marginTop: Spacing.sm, borderWidth: 1, borderColor: '#FFE082',
  },
  warningText: { fontSize: 12, color: '#F57F17', lineHeight: 18 },

  // Section
  section: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    ...Shadow.card, gap: Spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  sectionDesc: { fontSize: 13, color: Colors.neutralMid, lineHeight: 18 },

  // Buttons
  actionBtn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnSeçondary: {
    backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.greenPrimary,
  },
  actionBtnWarning: { backgroundColor: '#E53935' },
  actionBtnNeutral: { backgroundColor: Colors.neutralDark },
  btnDisabled: { opacity: 0.4 },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Tree picker
  treePicker: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.md, padding: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.greenPrimary,
  },
  treePickerText: { color: Colors.greenDark, fontWeight: '600', fontSize: 14 },
  treeList: {
    backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.neutralLight, maxHeight: 220,
  },
  treeItem: { padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  treeItemSelected: { backgroundColor: Colors.greenLight },
  treeItemName: { fontSize: 14, fontWeight: '600', color: Colors.neutralDark },
  treeItemLoc: { fontSize: 11, color: Colors.neutralMid },

  noteBox: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.md, padding: Spacing.md,
  },
  noteText: { fontSize: 12, color: Colors.neutralMid, lineHeight: 18 },
  sectionSimulator: { borderWidth: 2, borderColor: Colors.greenPrimary },
  resultBox: { backgroundColor: Colors.neutralBg, borderRadius: Radius.md, padding: Spacing.sm, gap: 4 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultKey: { fontSize: 12, color: Colors.neutralMid },
  resultVal: { fontSize: 12, fontWeight: '700', color: Colors.neutralDark },
  errorRow: { backgroundColor: '#FFEBEE', borderRadius: Radius.sm, padding: 6 },
  errorText: { fontSize: 12, color: Colors.error },
  errorCode: { fontSize: 11, color: Colors.error, fontWeight: '700' },
  hintText: { fontSize: 11, color: Colors.neutralMid, fontStyle: 'italic', marginTop: 2 },
  simulatorNote: {
    backgroundColor: '#E3F2FD', borderRadius: Radius.md, padding: Spacing.sm,
  },
  simulatorNoteText: { fontSize: 12, color: '#1565C0', lineHeight: 18 },
  code: { fontFamily: 'monospace', backgroundColor: '#BBDEFB', fontSize: 12 },
});
