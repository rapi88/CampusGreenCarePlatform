// Notification Settings stub
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

const SETTINGS = [
  { id: 'watering', label: 'Watering Reminders', desc: 'Get notified when it is time to water' },
  { id: 'chat', label: 'Chat Messages', desc: 'Receive new chat message notifications' },
];

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ watering: true, chat: true });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notification Settings</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.section}>
        {SETTINGS.map((s, i) => (
          <View key={s.id} style={[styles.row, i < SETTINGS.length - 1 && styles.rowBorder]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowDesc}>{s.desc}</Text>
            </View>
            <Switch
              value={enabled[s.id]}
              onValueChange={(v) => setEnabled((e) => ({ ...e, [s.id]: v }))}
              trackColor={{ false: Colors.neutralLight, true: Colors.greenPrimary }}
              thumbColor={Colors.white}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  section: { margin: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.xl, ...Shadow.card, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  rowDesc: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
});
