import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { awardApi } from "../../api/award.api";
import { useAuthStore } from "../../store/auth.store";
import ScaleButton from "../../components/common/ScaleButton";

export default function AwardsScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [awardUrl, setAwardUrl] = useState("");
  const [awardText, setAwardText] = useState("");

  const { data: awardResp, isLoading } = useQuery({
    queryKey: ["weeklyAward"],
    queryFn: () => awardApi.getWeeklyAward(),
  });

  useEffect(() => {
    if (awardResp?.data) {
      setAwardUrl(awardResp.data.photoUrl || "");
      setAwardText(awardResp.data.text || "");
    }
  }, [awardResp]);

  const updateAwardMutation = useMutation({
    mutationFn: () =>
      awardApi.updateWeeklyAward({
        photoUrl: awardUrl,
        text: awardText,
        userId: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyAward"] });
      Toast.show({
        type: "success",
        text1: "Başarılı",
        text2: "Ödül güncellendi!",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Ödül güncellenemedi",
      });
    },
  });

  const topWatererPhotoUrl = awardResp?.data?.photoUrl;
  const displayText = awardResp?.data?.text;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Ödüller</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Award display */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Haftanın En Çok Sulayanı 💧</Text>
            <Text style={styles.cardSubtitle}>
              Kampüsümüzü yeşillendiren gönüllülerimize teşekkür ederiz!
            </Text>
            {isLoading ? (
              <ActivityIndicator
                color={Colors.greenPrimary}
                style={{ marginVertical: Spacing.xl }}
              />
            ) : topWatererPhotoUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: topWatererPhotoUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {displayText ? (
                  <View style={styles.textOverlay}>
                    <Text style={styles.overlayText}>{displayText}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  Henüz fotoğraf paylaşılmadı.
                </Text>
              </View>
            )}
          </View>

          {/* Admin-only award editor */}
          {isAdmin && (
            <View style={styles.editorCard}>
              <Text style={styles.editorTitle}>⚙️ Haftanın Ödülünü Güncelle</Text>
              <TextInput
                style={styles.input}
                placeholder="Fotoğraf URL'sini yapıştırın..."
                value={awardUrl}
                onChangeText={setAwardUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={Colors.neutralMid}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ödülde görünecek metin..."
                value={awardText}
                onChangeText={setAwardText}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Colors.neutralMid}
              />
              <ScaleButton
                style={styles.saveBtn}
                onPress={() => updateAwardMutation.mutate()}
                disabled={updateAwardMutation.isPending}
              >
                {updateAwardMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>💾 Ödülü Kaydet</Text>
                )}
              </ScaleButton>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.neutralDark },
  content: { flexGrow: 1, padding: Spacing.md, gap: Spacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.greenDark,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.neutralLight,
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: Spacing.sm,
  },
  overlayText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: "100%",
    height: 300,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutralLight,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: Colors.neutralMid, fontSize: 14 },
  editorCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
    gap: Spacing.sm,
  },
  editorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.neutralDark,
    borderWidth: 1,
    borderColor: Colors.neutralLight,
  },
  textArea: {
    minHeight: 88,
  },
  saveBtn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  saveBtnText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
