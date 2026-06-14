// Admin Add/Edit Tree form
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator, Modal, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { adminApi } from '../../api/admin.api';
import { treesApi, Tree } from '../../api/trees.api';
import MapboxMap from '../../components/map/MapboxMap';
import { useAuthStore } from '../../store/auth.store';
import { extractError } from '../../utils/error';

type SelectedTreePhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

async function buildTreePhotoFormData(photo: SelectedTreePhoto) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(photo.uri);
    const blob = await response.blob();
    const typedBlob = blob.type ? blob : new Blob([blob], { type: photo.mimeType });
    formData.append('photo', typedBlob as any, photo.fileName);
    return formData;
  }

  formData.append('photo', {
    uri: photo.uri,
    type: photo.mimeType,
    name: photo.fileName,
  } as any);

  return formData;
}

function parseOptionalInteger(value: string) {
  const parsed = parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseOptionalDecimal(value: string) {
  const parsed = parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function AdminAddEditTreeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const treeId = route.params?.treeId;
  const isEdit = !!treeId;
  const isAdmin = user?.role === 'ADMIN';
  const isSuggestionMode = !isAdmin && !isEdit;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [estimatedAge, setEstimatedAge] = useState('');
  const [height, setHeight] = useState('');
  const [wateringPeriodDays, setWateringPeriodDays] = useState('3');
  const [isNaturalMonument, setIsNaturalMonument] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPin, setTempPin] = useState<{lat: number, lng: number} | null>(null);
  const [photo, setPhoto] = useState<SelectedTreePhoto | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const { data: treeResponse, isLoading: isLoadingTree } = useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => treesApi.getById(treeId),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && treeResponse?.data) {
      const t = treeResponse.data;
      setName(t.name || '');
      setSpecies(t.species || '');
      setLocation(t.location || '');
      setLatitude(t.latitude?.toString() || '');
      setLongitude(t.longitude?.toString() || '');
      setEstimatedAge(t.estimatedAge && t.estimatedAge > 0 ? t.estimatedAge.toString() : '');
      setHeight(t.height && t.height > 0 ? t.height.toString() : '');
      setWateringPeriodDays(t.wateringPeriodDays?.toString() || '3');
      setIsNaturalMonument(t.isNaturalMonument || false);
      setExistingPhotoUrl(t.photoUrl || null);
    }
  }, [treeResponse, isEdit]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Tree>) => {
      if (isSuggestionMode) {
        const saveResponse = await treesApi.suggest(data);

        if (photo) {
          const formData = await buildTreePhotoFormData(photo);
          return treesApi.uploadTreePhoto(saveResponse.data.id, formData);
        }

        return saveResponse;
      }

      const saveResponse = isEdit
        ? await adminApi.updateTree(treeId, data)
        : await adminApi.createTree(data);

      if (photo) {
        const formData = await buildTreePhotoFormData(photo);
        return adminApi.uploadTreePhoto(saveResponse.data.id, formData);
      }

      return saveResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      queryClient.invalidateQueries({ queryKey: ['my-trees'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: isSuggestionMode
          ? 'Ağaç öneriniz admin onayına gönderildi.'
          : `Ağaç başarıyla ${isEdit ? 'güncellendi' : 'eklendi'}.`,
      });
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Tree save failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: extractError(error),
      });
    }
  });

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Ağaç fotoğrafı seçmek için galeri erişimi gerekir.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    setPhoto({
      uri: asset.uri,
      mimeType,
      fileName: asset.fileName ?? `tree-photo.${extension}`,
    });
  };

  const handleSave = () => {
    if (!name || !species || !location || !latitude || !longitude) {
      Alert.alert('Eksik Alanlar', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const basePayload = {
      name,
      species,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      estimatedAge: parseOptionalInteger(estimatedAge),
      height: parseOptionalDecimal(height),
      wateringPeriodDays: parseInt(wateringPeriodDays, 10),
    };

    if (isSuggestionMode) {
      saveMutation.mutate(basePayload);
      return;
    }

    saveMutation.mutate({
      ...basePayload,
      isNaturalMonument,
      status: 'ACTIVE' // Admin created trees are ACTIVE directly
    });
  };

  const handleMapClick = (coords: {lat: number, lng: number}) => {
    setTempPin(coords);
  };

  const confirmMapPin = () => {
    if (tempPin) {
      setLatitude(tempPin.lat.toFixed(6));
      setLongitude(tempPin.lng.toFixed(6));
    }
    setShowMapModal(false);
  };

  if (isEdit && isLoadingTree) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.greenPrimary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Ağacı Düzenle' : '+ Ağaç Ekle'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          nestedScrollEnabled
          scrollEnabled
          bounces
          alwaysBounceVertical
          showsVerticalScrollIndicator
          contentInsetAdjustmentBehavior="automatic"
          overScrollMode="always"
        >
          <Text style={styles.sectionLabel}>Ağaç Bilgileri</Text>
          <FormInput label="Ağaç Adı *" placeholder="örn. Beyaz Meşe" value={name} onChangeText={setName} />
          <FormInput label="Tür *" placeholder="örn. Quercus alba" value={species} onChangeText={setSpecies} />
          <FormInput label="Konum Açıklaması *" placeholder="örn. Merkez Avlu" value={location} onChangeText={setLocation} />

          <Text style={styles.sectionLabel}>Fiziksel Bilgiler</Text>
          <View style={styles.coordRow}>
            <View style={styles.coordInput}>
              <FormInput
                label="Tahmini Yaş"
                placeholder="Bilinmiyor"
                value={estimatedAge}
                onChangeText={setEstimatedAge}
                keyboardType="number-pad"
                style={styles.coordTextInput}
              />
            </View>
            <View style={styles.coordInput}>
              <FormInput
                label="Boy (metre)"
                placeholder="Bilinmiyor"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                style={styles.coordTextInput}
              />
            </View>
          </View>

        <Text style={styles.sectionLabel}>Ağaç Fotoğrafı</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
          {photo?.uri || existingPhotoUrl ? (
            <Image source={{ uri: photo?.uri ?? existingPhotoUrl! }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Fotoğraf Seç</Text>
            </View>
          )}
        </TouchableOpacity>
        {(photo?.uri || existingPhotoUrl) && (
          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickPhoto}>
            <Text style={styles.changePhotoText}>Fotoğrafı Değiştir</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>GPS Koordinatları</Text>
        <View style={styles.coordRow}>
          <View style={styles.coordInput}>
            <FormInput
              label="Enlem *"
              placeholder="40.8040"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="decimal-pad"
              style={styles.coordTextInput}
            />
          </View>
          <View style={styles.coordInput}>
            <FormInput
              label="Boylam *"
              placeholder="29.3610"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="decimal-pad"
              style={styles.coordTextInput}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.mapPicker} onPress={() => setShowMapModal(true)}>
          <Text style={styles.mapPickerText}>🗺️ Haritadan Seç</Text>
          <Text style={styles.mapPickerSub}>{latitude && longitude ? `Seçili: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : '(Konumu elle girin veya haritadan seçin)'}</Text>
        </TouchableOpacity>

        <Modal visible={showMapModal} animationType="slide">
          <View style={styles.mapModal}>
            <View style={styles.mapModalHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)}><Text style={styles.mapModalClose}>İptal</Text></TouchableOpacity>
              <Text style={styles.mapModalTitle}>Konum Seç</Text>
              <TouchableOpacity onPress={confirmMapPin}><Text style={styles.mapModalConfirm}>Onayla</Text></TouchableOpacity>
            </View>
            <View style={styles.mapContainer}>
              <MapboxMap
                trees={[]}
                selectedTreeId={null}
                onMarkerPress={() => {}}
                initialCenter={latitude && longitude ? [parseFloat(longitude), parseFloat(latitude)] : [29.361, 40.804]}
                initialZoom={15}
                isAddingTree={true}
                pendingPin={tempPin}
                onMapClick={handleMapClick}
              />
            </View>
          </View>
        </Modal>

        <Text style={styles.sectionLabel}>Bakım Ayarları</Text>
        <FormInput label="Sulama Periyodu (gün)" placeholder="3" value={wateringPeriodDays} onChangeText={setWateringPeriodDays} keyboardType="number-pad" />

        {!isSuggestionMode && (
          <>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Doğal Anıt</Text>
                <Text style={styles.switchDesc}>Bu ağaç doğal anıt olarak kabul ediliyor mu?</Text>
              </View>
              <Switch value={isNaturalMonument} onValueChange={setIsNaturalMonument} trackColor={{ false: Colors.neutralLight, true: Colors.greenPrimary }} thumbColor={Colors.white} />
            </View>
          </>
        )}

          <TouchableOpacity 
            style={[styles.saveBtn, saveMutation.isPending && { backgroundColor: Colors.neutralMid }]} 
            onPress={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? '💾 Değişiklikleri Kaydet' : '+ Ağaç Ekle'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  form: { flexGrow: 1, padding: Spacing.md, paddingBottom: 220 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.neutralMid, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.sm },
  coordRow: { flexDirection: 'row', gap: Spacing.sm },
  coordInput: { flex: 1, minWidth: 0 },
  coordTextInput: { fontSize: 14 },
  photoPicker: {
    height: 180,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.neutralLight,
    marginBottom: Spacing.sm,
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: Colors.greenPrimary,
    borderStyle: 'dashed',
  },
  photoIcon: { fontSize: 32, marginBottom: 8 },
  photoText: { fontSize: 15, fontWeight: '700', color: Colors.greenDark },
  changePhotoBtn: { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  changePhotoText: { color: Colors.greenPrimary, fontSize: 13, fontWeight: '700' },
  mapPicker: {
    height: 120,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.greenPrimary,
    borderStyle: 'dashed',
  },
  mapPickerText: { fontSize: 16, fontWeight: '600', color: Colors.greenDark },
  mapPickerSub: { fontSize: 12, color: Colors.neutralMid, marginTop: 4 },
  mapModal: { flex: 1, backgroundColor: Colors.white },
  mapModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight },
  mapModalTitle: { fontSize: 16, fontWeight: '700', color: Colors.neutralDark },
  mapModalClose: { color: Colors.neutralMid, fontSize: 16 },
  mapModalConfirm: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '700' },
  mapContainer: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.neutralDark },
  switchDesc: { fontSize: 12, color: Colors.neutralMid },
  saveBtn: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.md, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
