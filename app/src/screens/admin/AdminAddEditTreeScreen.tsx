// Admin Add/Edit Tree form
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { adminApi } from '../../api/admin.api';
import { treesApi, Tree } from '../../api/trees.api';
import MapboxMap from '../../components/map/MapboxMap';

export default function AdminAddEditTreeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const treeId = route.params?.treeId;
  const isEdit = !!treeId;

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [wateringPeriodDays, setWateringPeriodDays] = useState('3');
  const [isNaturalMonument, setIsNaturalMonument] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempPin, setTempPin] = useState<{lat: number, lng: number} | null>(null);

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
      setWateringPeriodDays(t.wateringPeriodDays?.toString() || '3');
      setIsNaturalMonument(t.isNaturalMonument || false);
    }
  }, [treeResponse, isEdit]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Tree>) => {
      if (isEdit) {
        return adminApi.updateTree(treeId, data);
      } else {
        return adminApi.createTree(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
      Toast.show({ type: 'success', text1: 'Success', text2: `Tree ${isEdit ? 'updated' : 'added'} successfully.` });
      navigation.goBack();
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to ${isEdit ? 'update' : 'add'} tree.` });
    }
  });

  const handleSave = () => {
    if (!name || !species || !location || !latitude || !longitude) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    
    saveMutation.mutate({
      name,
      species,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      wateringPeriodDays: parseInt(wateringPeriodDays, 10),
      isNaturalMonument,
      status: 'ACTIVE' // Admin created trees are ACTIVE directly
    });
  };

  const handleMapClick = (coords: {lat: number, lng: number}) => {
    setTempPin(coords);
  };

  const confirmMapPin = () => {
    if (tempPin) {
      setLatitude(tempPin.lat.toString());
      setLongitude(tempPin.lng.toString());
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
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Tree' : '+ Add Tree'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Tree Information</Text>
        <FormInput label="Tree Name *" placeholder="e.g. White Oak" value={name} onChangeText={setName} />
        <FormInput label="Species *" placeholder="e.g. Quercus alba" value={species} onChangeText={setSpecies} />
        <FormInput label="Location Description *" placeholder="e.g. Central Courtyard" value={location} onChangeText={setLocation} />

        <Text style={styles.sectionLabel}>GPS Coordinates</Text>
        <View style={styles.coordRow}>
          <View style={styles.coordInput}>
            <FormInput label="Latitude *" placeholder="40.8040" value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" />
          </View>
          <View style={styles.coordInput}>
            <FormInput label="Longitude *" placeholder="29.3610" value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" />
          </View>
        </View>

        <TouchableOpacity style={styles.mapPicker} onPress={() => setShowMapModal(true)}>
          <Text style={styles.mapPickerText}>🗺️ Pick from Map</Text>
          <Text style={styles.mapPickerSub}>{latitude && longitude ? `Selected: ${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : '(Select location manually or use picker)'}</Text>
        </TouchableOpacity>

        <Modal visible={showMapModal} animationType="slide">
          <View style={styles.mapModal}>
            <View style={styles.mapModalHeader}>
              <TouchableOpacity onPress={() => setShowMapModal(false)}><Text style={styles.mapModalClose}>Cancel</Text></TouchableOpacity>
              <Text style={styles.mapModalTitle}>Select Location</Text>
              <TouchableOpacity onPress={confirmMapPin}><Text style={styles.mapModalConfirm}>Confirm</Text></TouchableOpacity>
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

        <Text style={styles.sectionLabel}>Maintenance Settings</Text>
        <FormInput label="Watering Period (days)" placeholder="3" value={wateringPeriodDays} onChangeText={setWateringPeriodDays} keyboardType="number-pad" />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Natural Monument</Text>
            <Text style={styles.switchDesc}>Is this tree considered a natural monument?</Text>
          </View>
          <Switch value={isNaturalMonument} onValueChange={setIsNaturalMonument} trackColor={{ false: Colors.neutralLight, true: Colors.greenPrimary }} thumbColor={Colors.white} />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saveMutation.isPending && { backgroundColor: Colors.neutralMid }]} 
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? '💾 Save Changes' : '+ Add Tree'}</Text>
          )}
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
