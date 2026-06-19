import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ScaleButton from "../../components/common/ScaleButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import FormInput from "../../components/common/FormInput";
import { isGTUEmail } from "../../utils/validators";
import { authApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/auth.store";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { setAuth } = useAuthStore();

  const validate = () => {
    let valid = true;
    if (!isGTUEmail(email)) {
      setEmailError("Lütfen geçerli bir GTÜ e-postasi girin (@gtu.edu.tr)");
      valid = false;
    } else setEmailError("");
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      await AsyncStorage.setItem("token", res.data.token);
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Bir hata oluştu.";
      if (msg.toLowerCase().includes("doğrulanmamış") || msg.toLowerCase().includes("kodunu")) {
        setNeedsVerification(true);
        Alert.alert("Doğrulama Gerekli", msg);
      } else {
        Alert.alert("Giriş Hatası", msg);
      }
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/applogo1.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>Hoşgeldin!!</Text>
          <Text style={styles.subtitle}>GTÜ Kampüs Yeşil Bakım Platformu</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            label="GTU E-posta"
            placeholder="name.surname@gtu.edu.tr"
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
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotLink}
          >
            <Text style={styles.link}>Şifrenizi mi unuttunuz?</Text>
          </TouchableOpacity>

          <ScaleButton
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Giriş Yap</Text>
            )}
          </ScaleButton>

          <View style={styles.registerRow}>
            <Text style={styles.muted}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
          
          {needsVerification && (
            <View style={[styles.registerRow, { marginTop: Spacing.sm }]}>
              <TouchableOpacity onPress={() => navigation.navigate("VerifyCode", { email })}>
                <Text style={styles.link}>Doğrulama kodunu girmek için tıklayın</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  header: { alignItems: "center", marginTop: 60, marginBottom: 40 },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  logoImage: { width: 124, height: 124, resizeMode: "contain" },
  title: { fontSize: 28, fontWeight: "700", color: Colors.neutralDark },
  subtitle: { fontSize: 14, color: Colors.neutralMid, marginTop: 4 },
  form: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  forgotLink: { alignSelf: "flex-end", marginBottom: Spacing.md },
  link: { color: Colors.greenPrimary, fontWeight: "600", fontSize: 14 },
  btn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  muted: { color: Colors.neutralMid, fontSize: 14 },
});
