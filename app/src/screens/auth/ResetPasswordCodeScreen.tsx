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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import { authApi } from "../../api/auth.api";
import { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPasswordCode">;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ResetPasswordCodeScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState("");
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
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleVerify = async (verificationCode = code) => {
    if (verificationCode.length !== CODE_LENGTH) return;
    
    setLoading(true);
    try {
      const res = await authApi.verifyResetCode(email, verificationCode);
      navigation.navigate("ResetPasswordNew", { email, resetToken: res.data.resetToken });
    } catch (err: any) {
      shake();
      setCode("");
      inputRef.current?.focus();
      Alert.alert("Hata", err.response?.data?.message ?? "Geçersiz veya süresi dolmuş kod.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResendLoading(true);
    try {
      await authApi.forgotPassword(email); // Re-trigger forgot password flow to send new code
      setTimer(RESEND_COOLDOWN);
      Alert.alert("Başarılı", "Yeni şifre sıfırlama kodu gönderildi.");
    } catch (err: any) {
      Alert.alert("Hata", "Kod gönderilemedi.");
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
    return g1 + "*".repeat(g2.length) + g3;
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        alwaysBounceVertical={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Şifre Sıfırlama Kodu</Text>
          <Text style={styles.desc}>
            <Text style={styles.bold}>{maskedEmail}</Text> adresinize şifrenizi sıfırlamanız için 6 haneli bir kod gönderdik.
          </Text>

          <Animated.View style={[styles.codeContainer, { transform: [{ translateX: shakeAnimation }] }]}>
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
                    code.length > i && styles.codeBoxFilled
                  ]}
                >
                  <Text style={styles.codeText}>{code[i] || ""}</Text>
                </View>
              ))}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.btn, (loading || code.length !== CODE_LENGTH) && styles.btnDisabled]}
            onPress={() => handleVerify(code)}
            disabled={loading || code.length !== CODE_LENGTH}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.btnText}>Doğrula</Text>
            )}
          </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.neutralBg },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  back: { marginTop: 50, marginBottom: Spacing.xl },
  backText: { color: Colors.greenPrimary, fontSize: 16, fontWeight: "500" },
  content: { flex: 1, alignItems: "center", paddingTop: Spacing.xl },
  icon: { fontSize: 56, marginBottom: Spacing.md },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: 15,
    color: Colors.neutralMid,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  bold: { fontWeight: "700", color: Colors.neutralDark },
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
    width: 48,
    height: 56,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxActive: {
    borderColor: Colors.greenPrimary,
    borderWidth: 2,
    shadowColor: Colors.greenPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  codeBoxFilled: {
    borderColor: Colors.neutralMid,
  },
  codeText: {
    fontSize: 24,
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
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  muted: { color: Colors.neutralMid, fontSize: 14 },
  link: { color: Colors.greenPrimary, fontWeight: "600", fontSize: 14 },
  timerText: { color: Colors.neutralMid, fontWeight: "600", fontSize: 14 },
});
