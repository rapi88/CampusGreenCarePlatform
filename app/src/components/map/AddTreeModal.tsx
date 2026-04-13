// AddTreeModal — modal form for admin to add a new tree at a map location
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStatus } from '../../store/map.store';

interface AddTreeModalProps {
  visible: boolean;
  coordinates: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    location: string;
    status: TreeStatus;
    lat: number;
    lng: number;
  }) => void;
}

const STATUS_OPTIONS: { value: TreeStatus; label: string; emoji: string; color: string }[] = [
  { value: 'watered', label: 'Sulandı', emoji: '🟢', color: Colors.statusOk },
  { value: 'needs_water', label: 'Sulama Gerekli', emoji: '🔴', color: Colors.statusDue },
  { value: 'due_soon', label: 'Yakında Sulanmalı', emoji: '🟠', color: Colors.statusSoon },
];

export default function AddTreeModal({ visible, coordinates, onClose, onSubmit }: AddTreeModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<TreeStatus>('needs_water');
  const [errors, setErrors] = useState<{ name?: string; location?: string }>({});

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Ağaç adı gerekli';
    if (!location.trim()) newErrors.location = 'Konum açıklaması gerekli';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!coordinates) return;

    onSubmit({
      name: name.trim(),
      location: location.trim(),
      status,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    // Reset form
    setName('');
    setLocation('');
    setStatus('needs_water');
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setLocation('');
    setStatus('needs_water');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitle}>
                <Text style={styles.headerEmoji}>🌱</Text>
                <Text style={styles.headerText}>Yeni Ağaç Ekle</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Coordinates display */}
              {coordinates && (
                <View style={styles.coordsCard}>
                  <Text style={styles.coordsIcon}>📍</Text>
                  <View style={styles.coordsInfo}>
                    <Text style={styles.coordsLabel}>Seçilen Konum</Text>
                    <Text style={styles.coordsText}>
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tree name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Ağaç Adı *</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="örn. Ak Meşe #048"
                  value={name}
                  onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                  placeholderTextColor={Colors.neutralMid}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Location description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Konum Açıklaması *</Text>
                <TextInput
                  style={[styles.input, errors.location ? styles.inputError : null]}
                  placeholder="örn. Kütüphane Önü, B Blok"
                  value={location}
                  onChangeText={(t) => { setLocation(t); setErrors((e) => ({ ...e, location: undefined })); }}
                  placeholderTextColor={Colors.neutralMid}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>

              {/* Status selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sulama Durumu</Text>
                <View style={styles.statusOptions}>
                  {STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.statusOption,
                        status === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                      ]}
                      onPress={() => setStatus(opt.value)}
                    >
                      <Text style={styles.statusEmoji}>{opt.emoji}</Text>
                      <Text style={[
                        styles.statusLabel,
                        status === opt.value && { color: opt.color, fontWeight: '700' },
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>🌳 Ağaç Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    ...Shadow.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: { fontSize: 24 },
  headerText: { fontSize: 20, fontWeight: '700', color: Colors.neutralDark },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutralBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: Colors.neutralMid, fontWeight: '600' },
  form: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  coordsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 10,
  },
  coordsIcon: { fontSize: 20 },
  coordsInfo: { flex: 1 },
  coordsLabel: { fontSize: 11, color: Colors.greenDark, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  coordsText: { fontSize: 13, color: Colors.neutralDark, fontWeight: '500', marginTop: 2 },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.neutralDark,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
  statusOptions: {
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.neutralBg,
    gap: 10,
  },
  statusEmoji: { fontSize: 16 },
  statusLabel: { fontSize: 14, color: Colors.neutralMid, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralLight,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutralBg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.neutralMid },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenPrimary,
    alignItems: 'center',
    ...Shadow.card,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
