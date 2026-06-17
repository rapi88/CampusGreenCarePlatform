// AddTreeModal — modal form for admin to add a new tree at a map location
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

interface AddTreeModalProps {
  visible: boolean;
  coordinates: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    species: string;
    location: string;
    health: 'Healthy' | 'Sick' | 'Critical';
    lat: number;
    lng: number;
  }) => void;
  isSuggesting?: boolean;
}

const HEALTH_OPTIONS: { value: 'Healthy' | 'Sick' | 'Critical'; label: string; emoji: string; color: string }[] = [
  { value: 'Healthy', label: 'Sağlıklı', emoji: '🟢', color: Colors.statusOk },
  { value: 'Sick', label: 'Hasta', emoji: '🟠', color: Colors.statusSoon },
  { value: 'Critical', label: 'Kritik', emoji: '🔴', color: Colors.statusDue },
];

export default function AddTreeModal({ visible, coordinates, onClose, onSubmit, isSuggesting = false }: AddTreeModalProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [health, setHealth] = useState<'Healthy' | 'Sick' | 'Critical'>('Healthy');
  const [errors, setErrors] = useState<{ name?: string; species?: string; location?: string }>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const nextKeyboardHeight = Platform.OS === 'ios'
        ? Math.max(0, windowHeight - (event.endCoordinates?.screenY ?? windowHeight))
        : event.endCoordinates?.height ?? 0;

      setKeyboardHeight(nextKeyboardHeight);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible, windowHeight]);

  const bottomInset = Math.max(insets.bottom, Spacing.sm);
  const keyboardOffset = Math.max(0, keyboardHeight - insets.bottom);
  const isCompact = windowWidth < 360;
  const modalMaxHeight = keyboardHeight > 0
    ? Math.max(320, windowHeight - keyboardOffset - insets.top - Spacing.sm)
    : Math.floor(windowHeight * 0.88);

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Ağaç adı zorunludur';
    if (!species.trim()) newErrors.species = 'Tür zorunludur';
    if (!location.trim()) newErrors.location = 'Konum açıklaması zorunludur';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!coordinates) return;

    onSubmit({
      name: name.trim(),
      species: species.trim(),
      location: location.trim(),
      health,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    // Reset form
    setName('');
    setSpecies('');
    setLocation('');
    setHealth('Healthy');
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setSpecies('');
    setLocation('');
    setHealth('Healthy');
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
          <View style={[styles.modalContainer, { maxHeight: modalMaxHeight }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerTitle}>
                <Text style={styles.headerEmoji}>🌱</Text>
                <Text style={styles.headerText} numberOfLines={1}>
                  {isSuggesting ? 'Ağaç Öner' : 'Yeni Ağaç Ekle'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              contentContainerStyle={[
                styles.formContent,
                { paddingBottom: keyboardHeight > 0 ? Spacing.lg : Spacing.sm },
              ]}
              showsVerticalScrollIndicator
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              nestedScrollEnabled
            >
              {/* Coordinates display */}
              {coordinates && (
                <View style={styles.coordsCard}>
                  <Text style={styles.coordsIcon}>📍</Text>
                  <View style={styles.coordsInfo}>
                    <Text style={styles.coordsLabel}>Seçili Konum</Text>
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
                  placeholder="örn. Beyaz Meşe #048"
                  value={name}
                  onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                  placeholderTextColor={Colors.neutralMid}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Species */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Tur *</Text>
                <TextInput
                  style={[styles.input, errors.species ? styles.inputError : null]}
                  placeholder="örn. Quercus alba"
                  value={species}
                  onChangeText={(t) => { setSpecies(t); setErrors((e) => ({ ...e, species: undefined })); }}
                  placeholderTextColor={Colors.neutralMid}
                />
                {errors.species && <Text style={styles.errorText}>{errors.species}</Text>}
              </View>

              {/* Location description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Konum Açıklaması *</Text>
                <TextInput
                  style={[styles.input, errors.location ? styles.inputError : null]}
                  placeholder="örn. Kutuphane onu, B Blok"
                  value={location}
                  onChangeText={(t) => { setLocation(t); setErrors((e) => ({ ...e, location: undefined })); }}
                  placeholderTextColor={Colors.neutralMid}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>

              {/* Health selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Ağaç Sağlığı</Text>
                <View style={styles.statusOptions}>
                  {HEALTH_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.statusOption,
                        health === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' },
                      ]}
                      onPress={() => setHealth(opt.value)}
                    >
                      <Text style={styles.statusEmoji}>{opt.emoji}</Text>
                      <Text style={[
                        styles.statusLabel,
                        health === opt.value && { color: opt.color, fontWeight: '700' },
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View
              style={[
                styles.actions,
                isCompact && styles.actionsCompact,
                { paddingBottom: keyboardHeight > 0 ? Spacing.md : bottomInset },
              ]}
            >
              <TouchableOpacity
                style={[styles.cancelBtn, isCompact && styles.actionBtnCompact]}
                onPress={handleClose}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isCompact && styles.actionBtnCompact]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText} numberOfLines={1}>
                  {isSuggesting ? '🌟 Ağaç Öner' : '🌳 Ağaç Ekle'}
                </Text>
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    paddingRight: Spacing.sm,
  },
  headerEmoji: { fontSize: 24 },
  headerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutralDark,
  },
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
  formContent: {
    paddingBottom: Spacing.sm,
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
  coordsText: {
    fontSize: 13,
    color: Colors.neutralDark,
    fontWeight: '500',
    marginTop: 2,
    flexShrink: 1,
  },
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
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralLight,
  },
  actionsCompact: {
    flexDirection: 'column-reverse',
  },
  actionBtnCompact: {
    flex: 0,
    width: '100%',
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
