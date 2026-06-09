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
  const [lastReceiptIds, setLastReceiptIds] = useState<string[]>([]);
  const [receiptResult, setReceiptResult] = useState<any>(null);
  const [receiptPending, setReceiptPending] = useState(false);

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
    onSuccess: (res) => Toast.show({ type: 'success', text1: '✅ Sent', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Error' }),
  });

  const reminderSelfMutation = useMutation({
    mutationFn: () => {
      if (!selectedTree) throw new Error('Select a tree first');
      return debugApi.sendWateringReminder(selectedTree.id, true);
    },
    onSuccess: (res) => Toast.show({ type: 'success', text1: '💧 Sent', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Select a tree first' }),
  });

  const reminderAdoptersMutation = useMutation({
    mutationFn: () => {
      if (!selectedTree) throw new Error('Select a tree first');
      return debugApi.sendWateringReminder(selectedTree.id, false);
    },
    onSuccess: (res) => Toast.show({ type: 'success', text1: '💧 Sent to Adopters', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Select a tree first' }),
  });

  const broadcastMutation = useMutation({
    mutationFn: () => debugApi.broadcastTest(),
    onSuccess: (res) => {
      const d = res.data;
      setLastReceiptIds(d.receiptIds ?? []);
      setReceiptResult(null);
      const type = d.rejected > 0 && d.accepted === 0 ? 'error' : 'success';
      Toast.show({ type, text1: '📢 Broadcast Result', text2: d.message });
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Error' }),
  });

  const cronMutation = useMutation({
    mutationFn: () => debugApi.triggerCron(),
    onSuccess: (res) => Toast.show({ type: 'success', text1: '🔄 Cron Triggered', text2: res.data.message }),
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Failed', text2: e?.response?.data?.message ?? 'Error' }),
  });

  const anyPending = selfTestMutation.isPending || reminderSelfMutation.isPending ||
    reminderAdoptersMutation.isPending || broadcastMutation.isPending || cronMutation.isPending || localPending || receiptPending;

  const checkReceipts = async () => {
    if (lastReceiptIds.length === 0) return;
    setReceiptPending(true);
    setReceiptResult(null);
    try {
      const res = await debugApi.checkReceipts(lastReceiptIds);
      setReceiptResult(res.data);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Receipt check failed', text2: e?.response?.data?.message ?? 'Error' });
    } finally {
      setReceiptPending(false);
    }
  };

  const sendLocalNotification = async (title: string, body: string, data?: Record<string, any>) => {
    setLocalPending(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Allow notifications in Settings.' });
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: data ?? {}, sound: true },
        trigger: null, // fire immediately
      });
      Toast.show({ type: 'success', text1: '✅ Local notification sent', text2: 'Check your notification banner.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message ?? 'Error' });
    } finally {
      setLocalPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notification Test Center</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Token Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Push Token Infrastructure</Text>
            <TouchableOpacity onPress={() => refetchStatus()}>
              <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>
          {statusLoading ? (
            <ActivityIndicator color={Colors.greenPrimary} style={{ marginTop: 8 }} />
          ) : status ? (
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.registered}</Text>
                <Text style={styles.statusSub}>Tokens Registered</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusValue}>{status.unregistered}</Text>
                <Text style={styles.statusSub}>No Token</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusValue, { color: status.adminTokenRegistered ? Colors.greenPrimary : Colors.error }]}>
                  {status.adminTokenRegistered ? '✅' : '❌'}
                </Text>
                <Text style={styles.statusSub}>Your Token</Text>
              </View>
            </View>
          ) : null}
          {status && !status.adminTokenRegistered && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Your device has no registered push token. Restart the app and allow notification permissions.
              </Text>
            </View>
          )}
        </View>

        {/* Simulator / Local notification section — works without projectId */}
        {Platform.OS !== 'web' && (
          <View style={[styles.section, styles.sectionSimulator]}>
            <Text style={styles.sectionTitle}>📱 Local Notification Test</Text>
            <Text style={styles.sectionDesc}>
              Works in the simulator and on real devices without any Expo project ID or push token. The notification is delivered directly to this device.
            </Text>
            <ScaleButton
              style={[styles.actionBtn, anyPending && styles.btnDisabled]}
              onPress={() => sendLocalNotification('🧪 Test Notification', 'Local notifications are working correctly!', { type: 'local_test' })}
              disabled={anyPending}
            >
              {localPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.actionBtnText}>📲 Send Local Test Notification</Text>}
            </ScaleButton>
            <ScaleButton
              style={[styles.actionBtn, styles.actionBtnSecondary, anyPending && styles.btnDisabled]}
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
                    💧 Simulate Watering Reminder{selectedTree ? ` (${selectedTree.name})` : ''}
                  </Text>}
            </ScaleButton>
            <View style={styles.simulatorNote}>
              <Text style={styles.simulatorNoteText}>
                ℹ️ To enable remote push notifications, run:{'\n'}
                <Text style={styles.code}>npx eas init</Text>
                {'\n'}then add the printed UUID to EXPO_PROJECT_ID in app/.env and rebuild.
              </Text>
            </View>
          </View>
        )}

        {/* Section 1: Self Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1️⃣ Generic Push Test</Text>
          <Text style={styles.sectionDesc}>Verify the entire push pipeline by sending a test notification to your own device.</Text>
          <ScaleButton
            style={[styles.actionBtn, selfTestMutation.isPending && styles.btnDisabled]}
            onPress={() => selfTestMutation.mutate()}
            disabled={anyPending}
          >
            {selfTestMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>📨 Send Test Push to My Device</Text>}
          </ScaleButton>
        </View>

        {/* Section 2: Watering Reminder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ Watering Reminder</Text>
          <Text style={styles.sectionDesc}>Simulate the watering reminder notification for a specific tree.</Text>

          {/* Tree picker */}
          <TouchableOpacity
            style={styles.treePicker}
            onPress={() => setShowTreePicker(!showTreePicker)}
          >
            <Text style={styles.treePickerText}>
              {selectedTree ? `🌳 ${selectedTree.name}` : 'Tap to select a tree →'}
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
                  <Text style={{ color: Colors.neutralMid, textAlign: 'center' }}>No trees found</Text>
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
              : <Text style={styles.actionBtnText}>💧 Send Reminder to My Device</Text>}
          </ScaleButton>

          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnSecondary, (!selectedTree || anyPending) && styles.btnDisabled]}
            onPress={() => reminderAdoptersMutation.mutate()}
            disabled={!selectedTree || anyPending}
          >
            {reminderAdoptersMutation.isPending
              ? <ActivityIndicator color={Colors.greenPrimary} />
              : <Text style={[styles.actionBtnText, { color: Colors.greenPrimary }]}>💧 Send to All Tree Adopters</Text>}
          </ScaleButton>
        </View>

        {/* Section 3: Broadcast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3️⃣ Broadcast to All Users</Text>
          <Text style={styles.sectionDesc}>Send a test broadcast notification to every user who has a registered push token.</Text>
          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnWarning, anyPending && styles.btnDisabled]}
            onPress={() => broadcastMutation.mutate()}
            disabled={anyPending}
          >
            {broadcastMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>📢 Broadcast Test to All Users</Text>}
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

          {/* Receipt check — available after broadcast returns receiptIds */}
          {lastReceiptIds.length > 0 && (
            <ScaleButton
              style={[styles.actionBtn, styles.actionBtnNeutral, anyPending && styles.btnDisabled]}
              onPress={checkReceipts}
              disabled={anyPending}
            >
              {receiptPending
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.actionBtnText}>🔍 Check Delivery Receipts (~30s after send)</Text>}
            </ScaleButton>
          )}

          {/* Receipt result */}
          {receiptResult && (
            <View style={styles.resultBox}>
              <View style={styles.resultRow}>
                <Text style={styles.resultKey}>APNs Delivered</Text>
                <Text style={[styles.resultVal, { color: Colors.greenPrimary }]}>{receiptResult.delivered}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultKey}>APNs Failed</Text>
                <Text style={[styles.resultVal, receiptResult.failed > 0 && { color: Colors.error }]}>{receiptResult.failed}</Text>
              </View>
              {(receiptResult.errors ?? []).map((e: any, i: number) => (
                <View key={i} style={styles.errorRow}>
                  <Text style={styles.errorText}>❌ {e.errorCode}: {e.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 4: Trigger Cron */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4️⃣ Trigger Daily Cron Job</Text>
          <Text style={styles.sectionDesc}>
            Manually run the scheduler that checks all overdue trees and sends watering reminders to their adopters. Normally runs daily at 08:00.
          </Text>
          <ScaleButton
            style={[styles.actionBtn, styles.actionBtnNeutral, anyPending && styles.btnDisabled]}
            onPress={() => cronMutation.mutate()}
            disabled={anyPending}
          >
            {cronMutation.isPending
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.actionBtnText}>🔄 Run Daily Cron Now</Text>}
          </ScaleButton>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            ℹ️ This panel is only visible when EXPO_PUBLIC_NOTIFICATION_DEBUG=true in the app environment. Disable it before production release.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 },

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
  actionBtnSecondary: {
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
