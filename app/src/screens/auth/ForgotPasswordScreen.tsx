import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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
      setEmailError('Enter a valid GTU email');
      return;
    }
    setEmailError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert('Error', 'Failed to send password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.desc}>
          Enter your GTU email address, we will send you a password reset link.
        </Text>

        {!sent ? (
          <>
            <FormInput
              label="GTU Email"
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
                <Text style={styles.btnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successText}>
              Link sent! Check your inbox.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutralBg, padding: Spacing.lg },
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
