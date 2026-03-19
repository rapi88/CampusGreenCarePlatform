// Adoption screen — volunteer slots, adopt action
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<TreeStackParamList, 'Adoption'>;

const MOCK_VOLUNTEERS = [
  { id: 'u1', name: 'Mehmet Y.', initial: 'MY' },
  { id: 'u2', name: 'Zeynep K.', initial: 'ZK' },
];
const MAX = 4;

export default function AdoptionScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [adopted, setAdopted] = useState(false);
  const [nameModal, setNameModal] = useState(false);
  const [treeName, setTreeName] = useState('');

  const isFirst = volunteers.length === 0;
  const isFull = volunteers.length >= MAX;

  const handleAdopt = () => {
    if (isFirst) { setNameModal(true); return; }
    doAdopt();
  };

  const doAdopt = (customName?: string) => {
    setAdopted(true);
    setVolunteers((v) => [...v, { id: 'me', name: 'Sen', initial: 'BN' }]);
    if (customName) Alert.alert('Harika!', `Ağaca "${customName}" adını verdiniz 🌿`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Ağacı Sahiplen</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.treeIcon}>🌳</Text>
        <Text style={styles.title}>Ak Meşe #{treeId}</Text>
        <Text style={styles.subtitle}>Bu ağacı sahiplenerek sulama hatırlatmaları alacaksınız.</Text>

        {/* Volunteer slots */}
        <View style={styles.slotsSection}>
          <Text style={styles.slotsTitle}>Gönüllüler ({volunteers.length}/{MAX})</Text>
          <View style={styles.slots}>
            {Array.from({ length: MAX }).map((_, i) => {
              const vol = volunteers[i];
              return (
                <View key={i} style={[styles.slot, vol ? styles.slotFilled : styles.slotEmpty]}>
                  {vol ? (
                    <>
                      <Text style={styles.slotInitial}>{vol.initial}</Text>
                      <Text style={styles.slotName}>{vol.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.slotPlus}>+</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>💧 Sahiplendiğinizde sulama zamanı geldiğinde bildirim alırsınız.</Text>
          <Text style={styles.infoText}>🌿 Bir kullanıcı en fazla 10 ağaç sahiplenebilir.</Text>
          {isFirst && <Text style={styles.infoText}>✨ İlk sahiplenen ağaca özel bir isim verebilir!</Text>}
        </View>

        <TouchableOpacity
          style={[styles.adoptBtn, (isFull || adopted) && styles.adoptBtnDisabled]}
          disabled={isFull || adopted}
          onPress={handleAdopt}
        >
          <Text style={styles.adoptBtnText}>
            {adopted ? '✅ Sahiplendiniz' : isFull ? 'Kontenjan Dolu' : '🤝 Bu Ağacı Sahiplen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* First-adopter name modal */}
      <Modal visible={nameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ağaca İsim Ver 🌟</Text>
            <Text style={styles.modalSub}>İlk sahiplenen olarak bu ağaca özel bir isim verebilirsiniz (opsiyonel).</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Ağacın ismi…"
              value={treeName}
              onChangeText={setTreeName}
              maxLength={30}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalSkip} onPress={() => { setNameModal(false); doAdopt(); }}>
                <Text style={styles.modalSkipText}>Atla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={() => { setNameModal(false); doAdopt(treeName || undefined); }}>
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  body: { flex: 1, padding: Spacing.lg, alignItems: 'center' },
  treeIcon: { fontSize: 72, marginTop: Spacing.xl, marginBottom: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.xl },
  slotsSection: { width: '100%', marginBottom: Spacing.xl },
  slotsTitle: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark, marginBottom: Spacing.sm },
  slots: { flexDirection: 'row', gap: Spacing.sm },
  slot: { flex: 1, aspectRatio: 1, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  slotFilled: { backgroundColor: Colors.greenLight },
  slotEmpty: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.neutralLight, borderStyle: 'dashed' },
  slotInitial: { fontSize: 18, fontWeight: '700', color: Colors.greenDark },
  slotName: { fontSize: 10, color: Colors.neutralMid, marginTop: 2, textAlign: 'center' },
  slotPlus: { fontSize: 24, color: Colors.neutralLight },
  infoBox: { width: '100%', backgroundColor: Colors.greenLight, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.xl, gap: 6 },
  infoText: { fontSize: 13, color: Colors.neutralDark, lineHeight: 20 },
  adoptBtn: {
    width: '100%', backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  adoptBtnDisabled: { backgroundColor: Colors.neutralLight },
  adoptBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.neutralDark, marginBottom: 8 },
  modalSub: { fontSize: 14, color: Colors.neutralMid, marginBottom: Spacing.lg, lineHeight: 20 },
  nameInput: {
    borderWidth: 1.5, borderColor: Colors.neutralLight, borderRadius: Radius.md,
    height: 52, paddingHorizontal: Spacing.md, fontSize: 15, marginBottom: Spacing.lg,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  modalSkip: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutralBg, borderRadius: Radius.md },
  modalSkipText: { fontSize: 15, color: Colors.neutralMid, fontWeight: '600' },
  modalSave: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.greenPrimary, borderRadius: Radius.md },
  modalSaveText: { fontSize: 15, color: Colors.white, fontWeight: '700' },
});
