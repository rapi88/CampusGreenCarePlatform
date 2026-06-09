import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import ScaleButton from '../../components/common/ScaleButton';
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
      setEmailError('Please enter a valid GTU email (@gtu.edu.tr)');
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
      Alert.alert('Login Error', err.response?.data?.message ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🌿</Text></View>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>GTU Campus Green Care Platform</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <FormInput
          label="GTU Email"
          placeholder="name.surname@gtu.edu.tr"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={emailError}
        />
        <FormInput
          label="Password"
          placeholder="Enter your password"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotLink}
        >
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <ScaleButton
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.btnText}>Login</Text>
          )}
        </ScaleButton>

        <View style={styles.registerRow}>
          <Text style={styles.muted}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Register</Text>
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
