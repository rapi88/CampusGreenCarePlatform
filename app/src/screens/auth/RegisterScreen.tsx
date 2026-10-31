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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import FormInput from "../../components/common/FormInput";
import ScaleButton from "../../components/common/ScaleButton";
import {
  isGTUEmail,
  isStrongPassword,
  passwordStrength,
} from "../../utils/validators";
import { authApi } from "../../api/auth.api";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    if (!name.trim()) e.name = "Ad soyad zorunludur";
    if (!isGTUEmail(email))
      e.email = "Geçerli bir GTÜ e-postası girin (@gtu.edu.tr)";
    if (!isStrongPassword(password))
      e.password =
        "En az 8 karakter olmalı, bir rakam ve bir büyük harf içermelidir";
    if (password !== confirm) e.confirm = "Şifreler eşleşmiyor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      navigation.navigate("VerifyCode", {
        email,
        devCode: res.data.devCode,
      });
    } catch (err: any) {
      Alert.alert(
        "Kayıt Hatası",
        err.response?.data?.message ?? "Kayıt işlemi başarısız oldu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>

            <Image
              source={require("../../assets/applogo1.png")}
              style={styles.topLogo}
              resizeMode="contain"
            />
          </View>

          {/* Title Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Hesap Oluştur 🌱</Text>
            <Text style={styles.subtitle}>
              GTÜ e-posta adresinizle kayıt olarak kampüs yeşil bakımına katılın
            </Text>
          </View>

          {/* Form Fields */}
          <FormInput
            label="Ad Soyad"
            placeholder="Adınız Soyadınız"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={errors.name}
          />

          <FormInput
            label="GTÜ E-posta"
            placeholder="ogrenci@gtu.edu.tr"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
          />

          <FormInput
            label="Şifre"
            placeholder="En az 8 karakter, 1 büyük harf ve 1 rakam"
            isPassword
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
            }}
            error={errors.password}
          />

          {/* Password strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
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
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                Şifre Gücü: {strength === "weak" ? "Zayıf" : strength === "fair" ? "Orta" : "Güçlü"}
              </Text>
            </View>
          )}

          <FormInput
            label="Şifreyi Onayla"
            placeholder="Şifrenizi tekrar girin"
            isPassword
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: "" }));
            }}
            error={errors.confirm}
          />

          {/* Submit Button */}
          <ScaleButton
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Kayıt Ol</Text>
            )}
          </ScaleButton>

          {/* Already have an account */}
          <View style={styles.loginRow}>
            <Text style={styles.muted}>Zaten bir hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.neutralBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.neutralBg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.neutralLight,
  },
  backArrow: {
    fontSize: 16,
    color: Colors.greenPrimary,
    fontWeight: "700",
    marginRight: 4,
  },
  backText: {
    color: Colors.greenPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  topLogo: {
    width: 36,
    height: 36,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutralMid,
    lineHeight: 20,
  },
  strengthContainer: {
    marginTop: -4,
    marginBottom: Spacing.md,
  },
  strengthRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  btn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    shadowColor: Colors.greenPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  muted: {
    color: Colors.neutralMid,
    fontSize: 14,
  },
  link: {
    color: Colors.greenPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
