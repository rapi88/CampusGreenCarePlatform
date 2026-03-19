// Admin Add/Edit Tree form
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';

export default function AdminAddEditTreeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isEdit = !!route.params?.treeId;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [wateringPeriod, setWateringPeriod] = useState('3');
  const [isMonument, setIsMonument] = useState(false);

  const handleSave = () => {
    if (!name || !species || !location || !lat || !lng) {
      Alert.alert('Eksik Alan', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    Alert.alert('Kaydedildi', `Ağaç "${name}" ${isEdit ? 'güncellendi' : 'eklendi'}.`, [
      { text: 'Tamam', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Ağacı Düzenle' : '+ Ağaç Ekle'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Ağaç Bilgileri</Text>
        <FormInput label="Ağaç Adı *" placeholder="örn. Ak Meşe" value={name} onChangeText={setName} />
        <FormInput label="Tür *" placeholder="örn. Quercus pubescens" value={species} onChangeText={setSpecies} />
        <FormInput label="Konum Açıklaması *" placeholder="örn. Merkezi Avlu, Sektör A" value={location} onChangeText={setLocation} />

        <Text style={styles.sectionLabel}>GPS Koordinatları</Text>
        <View style={styles.coordRow}>
          <View style={styles.coordInput}>
            <FormInput label="Enlem (Lat) *" placeholder="40.8040" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
          </View>
          <View style={styles.coordInput}>
            <FormInput label="Boylam (Lng) *" placeholder="29.3610" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
          </View>
        </View>

        {/* Map picker placeholder */}
        <View style={styles.mapPicker}>
          <Text style={styles.mapPickerText}>🗺️ Haritadan Pin Seç</Text>
          <Text style={styles.mapPickerSub}>(Mapbox picker entegrasyonu)</Text>
        </View>

        <Text style={styles.sectionLabel}>Bakım Ayarları</Text>
        <FormInput label="Sulama Periyodu (gün)" placeholder="3" value={wateringPeriod} onChangeText={setWateringPeriod} keyboardType="number-pad" />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Doğal Anıt</Text>
            <Text style={styles.switchDesc}>Bu ağaç doğal anıt statüsünde mi?</Text>
          </View>
          <Switch value={isMonument} onValueChange={setIsMonument} trackColor={{ false: Colors.neutralLight, true: Colors.greenPrimary }} thumbColor={Colors.white} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? '💾 Değişiklikleri Kaydet' : '+ Ağacı Ekle'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  form: { padding: Spacing.md, paddingBottom: 60 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.neutralMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.sm },
  coordRow: { flexDirection: 'row', gap: Spacing.sm },
  coordInput: { flex: 1 },
  mapPicker: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.lg, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.md, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.greenPrimary,
  },
  mapPickerText: { fontSize: 16, fontWeight: '600', color: Colors.greenDark },
  mapPickerSub: { fontSize: 12, color: Colors.neutralMid, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  switchDesc: { fontSize: 12, color: Colors.neutralMid },
  saveBtn: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.md, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
