// Admin Reports
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

const MOCK_REPORTS = [
  { id: '1', tree: 'Ak Meşe', user: 'Mehmet Y.', date: '19 Mar 2026 10:32', gpsVerified: true },
  { id: '2', tree: 'Kestane #042', user: 'Zeynep K.', date: '19 Mar 2026 09:15', gpsVerified: true },
  { id: '3', tree: 'Sedir #17', user: 'Ali R.', date: '18 Mar 2026 15:40', gpsVerified: false },
];

export default function AdminReportsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Sulama Raporları</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.datePicker}><Text style={styles.dateText}>📅 Tarih Aralığı Seç</Text></TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colWide]}>Ağaç</Text>
        <Text style={styles.col}>Kullanıcı</Text>
        <Text style={styles.col}>GPS</Text>
      </View>

      <FlatList
        data={MOCK_REPORTS}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.colWide}>
              <Text style={styles.rowTree}>{item.tree}</Text>
              <Text style={styles.rowDate}>{item.date}</Text>
            </View>
            <Text style={[styles.col, styles.rowUser]}>{item.user}</Text>
            <Text style={[styles.col, { color: item.gpsVerified ? Colors.greenPrimary : Colors.error, fontWeight: '700' }]}>
              {item.gpsVerified ? '✅' : '❌'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  dateRow: { padding: Spacing.md },
  datePicker: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', ...Shadow.card },
  dateText: { fontSize: 14, color: Colors.neutralDark, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.greenLight },
  col: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.neutralMid, textTransform: 'uppercase' },
  colWide: { flex: 2 },
  list: { paddingHorizontal: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  rowTree: { fontSize: 14, fontWeight: '600', color: Colors.neutralDark },
  rowDate: { fontSize: 11, color: Colors.neutralMid },
  rowUser: { fontSize: 13, color: Colors.neutralDark },
});
