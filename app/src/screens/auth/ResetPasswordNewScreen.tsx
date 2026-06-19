import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import FormInput from "../../components/common/FormInput";
import { isStrongPassword, passwordStrength } from "../../utils/validators";
import { authApi } from "../../api/auth.api";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPasswordNew">;

export default function ResetPasswordNewScreen({ route, navigation }: Props) {
  const { resetToken } = route.params;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const strengthColor = {
    weak: Colors.error,
    fair: Colors.statusSoon,
    strong: Colors.greenPrimary,
  }[strength];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isStrongPassword(password))
      e.password = "En az 8 karakter olmalı, bir rakam ve bir büyük harf içermelidir";
    if (password !== confirm) e.confirm = "Şifreler eşleşmiyor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, password);
      Alert.alert("Şifre Güncellendi", "Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.");
      navigation.reset({ 
        index: 0, 
        routes: [{ name: 'Login', params: { message: "Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz." } }] 
      });
    } catch (err: any) {
      Alert.alert(
        "Hata",
        err.response?.data?.message ?? "Şifre güncellenemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>Lütfen hesabınız için yeni ve güvenli bir şifre girin.</Text>

        <FormInput
          label="Yeni Şifre"
          placeholder="Güçlü bir şifre seçin"
          isPassword
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        {/* Password strength bar */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            {(["weak", "fair", "strong"] as const).map((s, i) => (
              <View
                key={s}
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      i <= ["weak", "fair", "strong"].indexOf(strength)
                        ? strengthColor
                        : Colors.neutralLight,
                  },
                ]}
              />
            ))}
            <Text style={[styles.strengthLabel, { color: strengthColor }]}>
              {strength === "weak"
                ? "Zayif"
                : strength === "fair"
                  ? "Orta"
                  : "Güçlü"}
            </Text>
          </View>
        )}

        <FormInput
          label="Yeni Şifreyi Onayla"
          placeholder="Şifrenizi tekrar girin"
          isPassword
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.btnText}>Şifreyi Güncelle</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.neutralBg },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.neutralBg,
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  back: { marginTop: 50, marginBottom: Spacing.lg },
  backText: { color: Colors.greenPrimary, fontSize: 16, fontWeight: "500" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralMid,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
    marginBottom: Spacing.md,
    gap: 4,
  },
  strengthBar: { height: 4, flex: 1, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: "600", marginLeft: 8 },
  btn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
