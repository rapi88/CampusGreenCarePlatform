// Status chip / badge component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { TreeStatus } from '../../api/trees.api';

type StatusType = 'watered' | 'needs_water' | 'due_soon' | 'Healthy' | 'Sick' | 'Critical' | TreeStatus;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  watered: { label: 'Sulandı', bg: Colors.greenLight, color: Colors.greenDark },
  needs_water: { label: 'Su Gerekli', bg: '#FFEBEE', color: Colors.statusDue },
  due_soon: { label: 'Yakında', bg: '#FFF3E0', color: Colors.statusSoon },
  Healthy: { label: 'Sağlıklı', bg: Colors.greenLight, color: Colors.greenDark },
  Sick: { label: 'Hasta', bg: '#FFF3E0', color: Colors.statusSoon },
  Critical: { label: 'Kritik', bg: '#FFEBEE', color: Colors.statusDue },
  ACTIVE: { label: 'Aktif', bg: Colors.greenLight, color: Colors.greenDark },
  PENDING: { label: 'Beklemede', bg: '#FFF3E0', color: Colors.statusSoon },
  DENIED: { label: 'Reddedildi', bg: '#FFEBEE', color: Colors.statusDue },
  REMOVED: { label: 'Kaldirildi', bg: '#E0E0E0', color: Colors.neutralDark },
};

interface StatusChipProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

export default function StatusChip({ status, size = 'md' }: StatusChipProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['watered'];
  return (
    <View style={[styles.chip, { backgroundColor: cfg.bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.label, { color: cfg.color }, size === 'sm' && styles.smText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontSize: 13, fontWeight: '600' },
  smText: { fontSize: 11 },
});
