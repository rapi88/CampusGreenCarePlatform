import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { isGTUEmail } from '../../utils/validators';
import { authApi } from '../../api/auth.api';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!isGTUEmail(email)) {
      setEmailError('Geçerli bir GTU e-postasi girin');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert('Hata', 'Şifre sifirlama istegi gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Geri</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Şifremi Unuttüm</Text>
        <Text style={styles.desc}>
          GTU e-posta adresinizi girin, size şifre sifirlama bağlantısi gönderelim.
        </Text>

        {!sent ? (
          <>
            <FormInput
              label="GTU E-posta"
              placeholder="name.surname@gtu.edu.tr"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnText}>Şifreyi Sifirla</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successText}>
              Bağlantı gönderildi! Gelen kutunuzu kontrol edin.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.neutralBg },
  container: { flexGrow: 1, backgroundColor: Colors.neutralBg, padding: Spacing.lg, paddingBottom: 120 },
  back: { marginTop: 50, marginBottom: Spacing.xxl },
  backText: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  content: { flex: 1, justifyContent: 'center' },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: '700', color: Colors.neutralDark, textAlign: 'center', marginBottom: Spacing.sm },
  desc: { fontSize: 14, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  btn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  successBox: { alignItems: 'center' },
  successEmoji: { fontSize: 48, marginBottom: Spacing.md },
  successText: { fontSize: 15, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22 },
});
