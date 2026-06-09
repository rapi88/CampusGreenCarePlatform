// Admin Reports
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { adminApi } from '../../api/admin.api';

export default function AdminReportsScreen() {
  const navigation = useNavigation<any>();

  // Default to past 7 days for example
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString());

  const { data: reportsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'reports', fromDate, toDate],
    queryFn: () => adminApi.getWateringReport(fromDate, toDate),
  });

  const reports = reportsResponse?.data || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Watering Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.datePicker}><Text style={styles.dateText}>📅 Select Date Range</Text></TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colWide]}>Tree</Text>
        <Text style={styles.col}>User</Text>
        <Text style={styles.col}>GPS</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r: any) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.colWide}>
                <Text style={styles.rowTree}>{item.treeName || item.tree?.name || 'Unknown Tree'}</Text>
                <Text style={styles.rowDate}>{new Date(item.wateredAt || item.date).toLocaleString()}</Text>
              </View>
              <Text style={[styles.col, styles.rowUser]}>{item.userName || item.user?.name || 'Unknown User'}</Text>
              <Text style={[styles.col, { color: item.gpsVerified ? Colors.greenPrimary : Colors.error, fontWeight: '700' }]}>
                {item.gpsVerified ? '✅' : '❌'}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>No watering reports found in this range.</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  dateRow: { padding: Spacing.md },
  datePicker: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', ...Shadow.card },
  dateText: { fontSize: 14, color: Colors.neutralDark, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.greenLight },
  col: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.neutralMid, textTransform: 'uppercase' },
  colWide: { flex: 2 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  rowTree: { fontSize: 14, fontWeight: '600', color: Colors.neutralDark },
  rowDate: { fontSize: 11, color: Colors.neutralMid },
  rowUser: { fontSize: 13, color: Colors.neutralDark },
});
