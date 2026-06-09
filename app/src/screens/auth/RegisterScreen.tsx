import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius } from '../../theme/spacing';
import FormInput from '../../components/common/FormInput';
import { isGTUEmail, isStrongPassword, passwordStrength } from '../../utils/validators';
import { authApi } from '../../api/auth.api';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);
  const strengthColor = { weak: Colors.error, fair: Colors.statusSoon, strong: Colors.greenPrimary }[strength];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!isGTUEmail(email)) e.email = 'Enter a valid GTU email (@gtu.edu.tr)';
    if (!isStrongPassword(password)) e.password = 'Must be at least 8 characters, include a number and an uppercase letter';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.checkEmoji}>✉️</Text>
        <Text style={styles.doneTitle}>Check your email!</Text>
        <Text style={styles.doneText}>
          We sent a verification link to your GTU email address. You can log in after verifying.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Register with your GTU student account</Text>

      <FormInput label="Full Name" placeholder="Your Full Name" value={name} onChangeText={setName} error={errors.name} />
      <FormInput label="GTU Email" placeholder="name.surname@gtu.edu.tr" keyboardType="email-address" value={email} onChangeText={setEmail} error={errors.email} />
      <FormInput label="Password" placeholder="Choose a strong password" isPassword value={password} onChangeText={setPassword} error={errors.password} />

      {/* Password strength bar */}
      {password.length > 0 && (
        <View style={styles.strengthRow}>
          {(['weak', 'fair', 'strong'] as const).map((s, i) => (
            <View
              key={s}
              style={[
                styles.strengthBar,
                { backgroundColor: i <= ['weak', 'fair', 'strong'].indexOf(strength) ? strengthColor : Colors.neutralLight }
              ]}
            />
          ))}
          <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strength === 'weak' ? 'Weak' : strength === 'fair' ? 'Fair' : 'Strong'}</Text>
        </View>
      )}

      <FormInput label="Confirm Password" placeholder="Re-enter your password" isPassword value={confirm} onChangeText={setConfirm} error={errors.confirm} />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.muted}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.neutralBg, padding: Spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center' },
  back: { marginTop: 50, marginBottom: Spacing.lg },
  backText: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.neutralDark, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.neutralMid, marginBottom: Spacing.xl },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: -8, marginBottom: Spacing.md, gap: 4 },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', marginLeft: 8 },
  btn: {
    backgroundColor: Colors.greenPrimary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  muted: { color: Colors.neutralMid, fontSize: 14 },
  link: { color: Colors.greenPrimary, fontWeight: '600', fontSize: 14 },
  checkEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  doneTitle: { fontSize: 24, fontWeight: '700', color: Colors.neutralDark, marginBottom: Spacing.sm, textAlign: 'center' },
  doneText: { fontSize: 15, color: Colors.neutralMid, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
});
