import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { isGTUEmail } from '../../utils/validators';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const validate = () => {
    let valid = true;
    if (!isGTUEmail(email)) {
      setEmailError('Lütfen geçerli bir GTU e-posta adresi girin (@gtu.edu.tr)');
      valid = false;
    } else setEmailError('');
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      await AsyncStorage.setItem('token', res.data.token);
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      Alert.alert('Giriş Hatası', err.response?.data?.message ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🌿</Text></View>
        <Text style={styles.title}>Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>GTU kampüs ağaç bakım platformu</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <FormInput
          label="GTU E-posta"
          placeholder="ad.soyad@gtu.edu.tr"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={emailError}
        />
        <FormInput
          label="Şifre"
          placeholder="Şifrenizi girin"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotLink}
        >
          <Text style={styles.link}>Şifremi unuttum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.btnText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.neutralMid, marginTop: Spacing.sm }]}
          onPress={async () => {
            const tempUser = {
              id: 'temp-123',
              name: 'Test Kullanıcısı',
              email: 'test@gtu.edu.tr',
              role: 'USER' as const,
              points: 120,
              adoptedTreeIds: [],
            };
            await AsyncStorage.setItem('token', 'temp-token');
            setAuth(tempUser, 'temp-token');
          }}
        >
          <Text style={styles.btnText}>Test Girişi (Geçici)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.neutralDark, marginTop: Spacing.sm }]}
          onPress={async () => {
            const tempAdmin = {
              id: 'admin-123',
              name: 'Admin Kullanıcısı',
              email: 'admin@gtu.edu.tr',
              role: 'ADMIN' as const,
              points: 0,
              adoptedTreeIds: [],
            };
            await AsyncStorage.setItem('token', 'temp-admin-token');
            setAuth(tempAdmin, 'temp-admin-token');
          }}
        >
          <Text style={styles.btnText}>Admin Girişi (Geçici)</Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.muted}>Hesabın yok mu? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.neutralBg, padding: Spacing.lg },
  header: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.neutralDark },
  subtitle: { fontSize: 14, color: Colors.neutralMid, marginTop: 4 },
  form: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg },
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.md },
  link: { color: Colors.greenPrimary, fontWeight: '600', fontSize: 14 },
  btn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  muted: { color: Colors.neutralMid, fontSize: 14 },
});
