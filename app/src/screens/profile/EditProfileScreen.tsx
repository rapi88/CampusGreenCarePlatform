import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Platform, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import ScaleButton from '../../components/common/ScaleButton';

type SelectedAvatar = {
  uri: string;
  mimeType: string;
  fileName: string;
};

async function buildAvatarFormData(avatar: SelectedAvatar) {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(avatar.uri);
    const blob = await response.blob();
    const typedBlob = blob.type ? blob : new Blob([blob], { type: avatar.mimeType });
    formData.append('avatar', typedBlob as any, avatar.fileName);
    return formData;
  }

  formData.append('avatar', {
    uri: avatar.uri,
    type: avatar.mimeType,
    name: avatar.fileName,
  } as any);

  return formData;
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initial = (name || user?.name || 'U').charAt(0).toUpperCase();

  const pickImage = async (source: 'library' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin gerekli', 'Fotoğraf çekmek için kamera erişimi gerekir.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri erişimi gerekir.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      uploadAvatar({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? `avatar.${extension}`,
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Hata', text2: e?.message ?? 'Seçici açılamadı' });
    }
  };

  const uploadAvatar = async (avatar: SelectedAvatar) => {
    setUploading(true);
    try {
      const formData = await buildAvatarFormData(avatar);
      const res = await authApi.uploadAvatar(formData);
      updateUser({ avatarUrl: res.data.avatarUrl });
      Toast.show({ type: 'success', text1: 'Fotoğraf güncellendi', text2: 'Profil fotoğrafınız başarıyla kaydedildi.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Yükleme başarısız', text2: e?.response?.data?.message ?? 'Lütfen tekrar deneyin.' });
    } finally {
      setUploading(false);
    }
  };

  const handlePickSource = () => {
    if (Platform.OS === 'web') {
      pickImage('library');
      return;
    }
    Alert.alert('Profil Fotoğrafını Değiştir', 'Nereden seçmek istersiniz?', [
      { text: 'Fotoğraf Çek', onPress: () => pickImage('camera') },
      { text: 'Galeriden Seç', onPress: () => pickImage('library') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Ad soyad alanı boş bırakılamaz.' });
      return;
    }
    if (name === user?.name) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim() });
      updateUser({ name: res.data.user.name });
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Profil bilgileriniz güncellendi.' });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Kaydetme başarısız', text2: e?.response?.data?.message ?? 'Tekrar deneyin.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + Spacing.lg }]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.card}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickSource} disabled={uploading}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  {uploading
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.cameraIcon}>📷</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Fotoğrafı değiştirmek için dokunun</Text>
            </View>

            {/* Inputs */}
            <View style={styles.inputSection}>
              <FormInput 
                label="Ad Soyad" 
                value={name} 
                onChangeText={setName} 
                placeholder="Örn: Ahmet Yılmaz"
                autoCapitalize="words"
              />
              
              <FormInput 
                label="E-posta" 
                value={user?.email ?? ''} 
                editable={false} 
                style={styles.disabledInput}
              />
              <Text style={styles.fieldNote}>E-posta adresi değiştirilemez.</Text>
            </View>
          </View>

          <ScaleButton 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave} 
            disabled={saving || uploading}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
            )}
          </ScaleButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralLight,
  },
  backBtn: { padding: Spacing.xs },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.neutralDark },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  body: { flexGrow: 1, padding: Spacing.md, paddingTop: Spacing.lg },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
    marginBottom: Spacing.xl,
  },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.greenLight },
  avatarCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.greenPrimary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.greenLight,
  },
  avatarInitial: { fontSize: 44, fontWeight: '800', color: Colors.white },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.neutralDark, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
    ...Shadow.card,
  },
  cameraIcon: { fontSize: 16 },
  avatarHint: { fontSize: 13, color: Colors.neutralMid, fontWeight: '500' },

  // Inputs
  inputSection: { gap: 4 },
  disabledInput: { color: Colors.neutralMid, backgroundColor: '#F8F9FA' },
  fieldNote: { fontSize: 12, color: Colors.neutralMid, marginTop: -10, marginBottom: Spacing.md },

  saveBtn: {
    width: '100%', backgroundColor: Colors.greenPrimary, borderRadius: Radius.lg,
    height: 56, alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
