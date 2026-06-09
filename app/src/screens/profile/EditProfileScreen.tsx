import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
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

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [uploading, setUploading] = useState(false);

  const initial = (user?.name ?? 'U').charAt(0).toUpperCase();

  const pickImage = async (source: 'library' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Camera access is needed to take a photo.');
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
          Alert.alert('Permission required', 'Photo library access is needed to pick a photo.');
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
      uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.message ?? 'Failed to open picker' });
    }
  };

  const uploadAvatar = async (uri: string, mimeType: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: mimeType,
        name: 'avatar.jpg',
      } as any);

      const res = await authApi.uploadAvatar(formData);
      updateUser({ avatarUrl: res.data.avatarUrl });
      Toast.show({ type: 'success', text1: 'Photo updated', text2: 'Your profile picture was saved.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: e?.response?.data?.message ?? 'Try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handlePickSource = () => {
    if (Platform.OS === 'web') {
      pickImage('library');
      return;
    }
    Alert.alert('Change Profile Photo', undefined, [
      { text: 'Take Photo', onPress: () => pickImage('camera') },
      { text: 'Choose from Library', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {/* Avatar */}
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
        <Text style={styles.avatarHint}>Tap to change photo</Text>

        {/* Name field — display only, no backend endpoint yet */}
        <FormInput label="Full Name" value={name} onChangeText={setName} />
        <Text style={styles.fieldNote}>Name changes are not yet saved to the server.</Text>

        <ScaleButton style={styles.saveBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.saveBtnText}>Done</Text>
        </ScaleButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  body: { padding: Spacing.lg, alignItems: 'center' },

  // Avatar
  avatarWrapper: { position: 'relative', marginBottom: 8, marginTop: Spacing.lg },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.greenPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 40, fontWeight: '700', color: Colors.white },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.neutralDark, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  cameraIcon: { fontSize: 16 },
  avatarHint: { fontSize: 12, color: Colors.neutralMid, marginBottom: Spacing.xl },

  fieldNote: { fontSize: 11, color: Colors.neutralMid, alignSelf: 'flex-start', marginTop: -Spacing.sm, marginBottom: Spacing.md },

  saveBtn: {
    width: '100%', backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
