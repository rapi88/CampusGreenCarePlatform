// Edit Profile stub
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { useAuthStore } from '../../store/auth.store';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Back</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.body}>
        <FormInput label="Full Name" value={name} onChangeText={setName} />
        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.white },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.neutralDark },
  body: { padding: Spacing.lg },
  saveBtn: { backgroundColor: Colors.greenPrimary, borderRadius: Radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
