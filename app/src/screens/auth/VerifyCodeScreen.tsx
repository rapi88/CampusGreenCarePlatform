import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import ScaleButton from "../../components/common/ScaleButton";
import { authApi } from "../../api/auth.api";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyCode">;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyCodeScreen({ route, navigation }: Props) {
  const { email, devCode } = route.params;
  const [code, setCode] = useState(devCode || "");
  const [currentDevCode, setCurrentDevCode] = useState(devCode);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async (verificationCode = code) => {
    if (verificationCode.length !== CODE_LENGTH) return;

    setLoading(true);
    try {
      await authApi.verifyCode(email, verificationCode);
      Alert.alert(
        "Doğrulama Başarılı! 🎉",
        "Hesabınız başarıyla doğrulandı. Şimdi giriş yapabilirsiniz.",
        [
          {
            text: "Giriş Yap",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "Login",
                    params: {
                      message: "Hesabınız başarıyla doğrulandı. Lütfen giriş yapın.",
                    },
                  },
                ],
              });
            },
          },
        ]
      );
    } catch (err: any) {
      shake();
      setCode("");
      inputRef.current?.focus();
      Alert.alert("Hata", err.response?.data?.message ?? "Geçersiz doğrulama kodu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResendLoading(true);
    try {
      const res = await authApi.resendCode(email);
      setTimer(RESEND_COOLDOWN);
      if (res.data.devCode) {
        setCurrentDevCode(res.data.devCode);
        setCode(res.data.devCode);
        Alert.alert("Yeni Kod", `Geliştirme modunda yeni kodunuz: ${res.data.devCode}`);
      } else {
        Alert.alert("Başarılı", "Yeni doğrulama kodu e-posta adresinize gönderildi.");
      }
    } catch (err: any) {
      Alert.alert("Hata", err.response?.data?.message ?? "Kod gönderilemedi.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(cleanText);
    if (cleanText.length === CODE_LENGTH) {
      handleVerify(cleanText);
    }
  };

  // Mask email: a.cepni@gtu.edu.tr -> a.***@gtu.edu.tr
  const maskedEmail = email.replace(/(^.{2})(.*)(@.*$)/, (m, g1, g2, g3) => {
    return g1 + "*".repeat(Math.max(1, g2.length)) + g3;
  });

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
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Geri</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>✉️</Text>
            </View>

            <Text style={styles.title}>Doğrulama Kodu</Text>
            <Text style={styles.desc}>
              <Text style={styles.bold}>{maskedEmail}</Text> adresine gönderilen 6 haneli kodu girin.
            </Text>

            {/* Dev Mode Banner if SMTP is disabled */}
            {currentDevCode ? (
              <TouchableOpacity
                style={styles.devBanner}
                onPress={() => {
                  setCode(currentDevCode);
                  handleVerify(currentDevCode);
                }}
              >
                <Text style={styles.devBannerTitle}>💡 Geliştirici Modu Aktif</Text>
                <Text style={styles.devBannerText}>
                  Doğrulama kodunuz: <Text style={styles.devCodeHighlight}>{currentDevCode}</Text>
                </Text>
                <Text style={styles.devBannerSub}>Otomatik doldurmak ve doğrulamak için dokunun</Text>
              </TouchableOpacity>
            ) : null}

            <Animated.View
              style={[
                styles.codeContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                autoFocus
                style={styles.hiddenInput}
                maxLength={CODE_LENGTH}
                caretHidden
              />

              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={styles.boxesRow}
              >
                {[...Array(CODE_LENGTH)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      code.length === i && styles.codeBoxActive,
                      code.length > i && styles.codeBoxFilled,
                    ]}
                  >
                    <Text style={styles.codeText}>{code[i] || ""}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            </Animated.View>

            <ScaleButton
              style={[
                styles.btn,
                (loading || code.length !== CODE_LENGTH) && styles.btnDisabled,
              ]}
              onPress={() => handleVerify(code)}
              disabled={loading || code.length !== CODE_LENGTH}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.btnText}>Doğrula</Text>
              )}
            </ScaleButton>

            <View style={styles.resendRow}>
              <Text style={styles.muted}>Kod gelmedi mi? </Text>
              {timer > 0 ? (
                <Text style={styles.timerText}>{timer}s bekle</Text>
              ) : resendLoading ? (
                <ActivityIndicator size="small" color={Colors.greenPrimary} />
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.link}>Tekrar Gönder</Text>
                </TouchableOpacity>
              )}
            </View>
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
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backBtn: {
    alignSelf: "flex-start",
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.neutralDark,
    marginBottom: Spacing.xs,
  },
  desc: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  bold: {
    fontWeight: "700",
    color: Colors.neutralDark,
  },
  devBanner: {
    width: "100%",
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  devBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.greenDark,
    marginBottom: 2,
  },
  devBannerText: {
    fontSize: 14,
    color: Colors.neutralDark,
  },
  devCodeHighlight: {
    fontWeight: "800",
    fontSize: 16,
    color: Colors.greenPrimary,
    letterSpacing: 2,
  },
  devBannerSub: {
    fontSize: 11,
    color: Colors.neutralMid,
    marginTop: 4,
  },
  codeContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    width: "100%",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxesRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  codeBox: {
    width: 46,
    height: 54,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxActive: {
    borderColor: Colors.greenPrimary,
    borderWidth: 2,
  },
  codeBoxFilled: {
    borderColor: Colors.neutralMid,
  },
  codeText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.neutralDark,
  },
  btn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.greenPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
  timerText: {
    color: Colors.neutralMid,
    fontWeight: "600",
    fontSize: 14,
  },
});
