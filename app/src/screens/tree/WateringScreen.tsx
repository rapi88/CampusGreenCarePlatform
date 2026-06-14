// GPS-verified watering screen
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import ScaleButton from "../../components/common/ScaleButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Colors } from "../../theme/colors";
import { Spacing, Radius } from "../../theme/spacing";
import { TreeStackParamList } from "../../navigation/MainTabs";
import { treesApi } from "../../api/trees.api";
import { useAuthStore } from "../../store/auth.store";
import { extractError } from "../../utils/error";
import { haversineDistance } from "../../utils/geo";

type Props = NativeStackScreenProps<TreeStackParamList, "Watering">;

const THRESHOLD_M = 200; // Expanded to 200m for easier testing, in prod you might want 10m

export default function WateringScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState<
    "checking" | "ready" | "far" | "success" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState(
    "Konum alınamadı. Lütfen tekrar deneyin.",
  );
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const { data: treeResponse } = useQuery({
    queryKey: ["tree", treeId],
    queryFn: () => treesApi.getById(treeId),
  });

  const treeCoords = useMemo(() => {
    return treeResponse?.data
      ? { lat: treeResponse.data.latitude, lng: treeResponse.data.longitude }
      : null;
  }, [treeResponse?.data?.latitude, treeResponse?.data?.longitude]);

  const isVolunteer = useMemo(() => {
    return treeResponse?.data?.volunteers?.some((v) => v.id === user?.id) ?? false;
  }, [treeResponse?.data?.volunteers, user?.id]);

  const waterMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      treesApi.water(treeId, coords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree", treeId] });
      queryClient.invalidateQueries({ queryKey: ["trees"] });
      queryClient.invalidateQueries({ queryKey: ["my-trees"] });
      setPhase("success");
      scaleAnim.setValue(0);
      setShowSuccessModal(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }).start();
      successTimeoutRef.current = setTimeout(() => {
        navigation.goBack();
      }, 10000);
    },
    onError: (error) => {
      const message = extractError(error);
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Sulama yapılamadı", text2: message });
      setPhase("error");
    },
  });

  useEffect(() => {
    if (!treeResponse?.data) return;

    if (!isVolunteer) {
      const message = "Bu ağacı sulayamazsınız. Bu ağacın gönüllüsü değilsiniz.";
      setErrorMessage(message);
      setShowVolunteerModal(true);
      setPhase("error");
      return;
    }

    if (treeCoords) {
      checkLocation();
    }
  }, [treeCoords, treeResponse?.data, isVolunteer]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const checkLocation = async () => {
    if (!treeCoords) return;
    if (!isVolunteer) {
      const message = "Bu ağacı sulayamazsınız. Bu ağacın gönüllüsü değilsiniz.";
      setErrorMessage(message);
      setShowVolunteerModal(true);
      setPhase("error");
      return;
    }

    setPhase("checking");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Konum izni verilmedi. Sulama yapabilmek için konum izni vermelisiniz.");
        setPhase("error");
        return;
      }
      let loc = null;
      try {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        loc = await Location.getLastKnownPositionAsync();
      }

      if (!loc) {
        setErrorMessage("Konum alınamadı. Lütfen cihaz konum servislerini kontrol edip tekrar deneyin.");
        setPhase("error");
        return;
      }

      setCurrentCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const dist = haversineDistance(
        loc.coords.latitude,
        loc.coords.longitude,
        treeCoords.lat,
        treeCoords.lng,
      );
      setDistanceM(Math.round(dist));
      setPhase(dist <= THRESHOLD_M ? "ready" : "far");
    } catch (error: any) {
      const message = error?.message || "Konum alınamadı. Lütfen tekrar deneyin.";
      setErrorMessage(message);
      Toast.show({ type: "error", text1: "Konum alınamadı", text2: message });
      setPhase("error");
    }
  };

  const handleWater = () => {
    if (currentCoords) {
      waterMutation.mutate(currentCoords);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ağacı Sula</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        {phase === "checking" && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.greenPrimary} />
            <Text style={styles.statusText}>Konum kontrol ediliyor…</Text>
          </View>
        )}

        {(phase === "ready" || phase === "far") && (
          <>
            <View
              style={[
                styles.distanceCard,
                phase === "ready" ? styles.distCardOk : styles.distCardFar,
              ]}
            >
              <Text style={styles.distEmoji}>
                {phase === "ready" ? "✅" : "❌"}
              </Text>
              <Text style={styles.distLabel}>Ağaca uzaklık</Text>
              <Text
                style={[
                  styles.distValue,
                  {
                    color: phase === "ready" ? Colors.greenDark : Colors.error,
                  },
                ]}
              >
                {distanceM} metre
              </Text>
              {phase === "far" && (
                <Text style={styles.farNote}>
                  Sulama yapabilmek için ağaca daha yakın olmalısınız (
                  {THRESHOLD_M} m içinde).
                </Text>
              )}
            </View>

            <ScaleButton
              style={[
                styles.waterBtn,
                phase === "far" && styles.waterBtnDisabled,
              ]}
              disabled={phase === "far" || waterMutation.isPending}
              onPress={handleWater}
            >
              {waterMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.waterBtnText}>🚿 Sulamayı Onayla</Text>
              )}
            </ScaleButton>

            <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}>
              <Text style={styles.retryText}>↻ Konumu Yenile</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === "success" && <View style={styles.center} />}

        {phase === "error" && (
          <View style={styles.center}>
            <Text style={styles.successEmoji}>⚠️</Text>
            <Text style={styles.successTitle}>Sulama yapılamadı</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            {isVolunteer && (
              <TouchableOpacity style={styles.retryBtn} onPress={checkLocation}>
                <Text style={styles.retryText}>Tekrar Dene</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showVolunteerModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowVolunteerModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIcon}>🚫</Text>
            </View>
            <Text style={styles.modalTitle}>Sulama yapılamaz</Text>
            <Text style={styles.modalMessage}>
              Bu ağacı sulayamazsınız. Bu ağacın gönüllüsü değilsiniz.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowVolunteerModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.modalIconCircle, styles.successIconCircle]}>
              <Text style={styles.modalIcon}>🌱</Text>
            </View>
            <Text style={styles.modalTitle}>Sulama onaylandı</Text>
            <Text style={styles.modalMessage}>
              Ağacı başarıyla suladınız. +10 puan kazandınız.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                if (successTimeoutRef.current) {
                  clearTimeout(successTimeoutRef.current);
                }
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalBtnText}>Tamam</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.neutralDark },
  scroll: { flex: 1 },
  body: { flexGrow: 1, padding: Spacing.lg, paddingBottom: 120, justifyContent: "center" },
  center: { alignItems: "center" },
  statusText: { marginTop: Spacing.md, fontSize: 16, color: Colors.neutralMid },
  distanceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  distCardOk: { backgroundColor: Colors.greenLight },
  distCardFar: { backgroundColor: "#FFEBEE" },
  distEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  distLabel: { fontSize: 14, color: Colors.neutralMid, marginBottom: 4 },
  distValue: { fontSize: 36, fontWeight: "700", marginBottom: Spacing.sm },
  farNote: {
    fontSize: 13,
    color: Colors.neutralMid,
    textAlign: "center",
    lineHeight: 18,
  },
  waterBtn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  waterBtnDisabled: { backgroundColor: Colors.neutralLight },
  waterBtnText: { color: Colors.white, fontSize: 17, fontWeight: "700" },
  retryBtn: { alignItems: "center", padding: Spacing.sm },
  retryText: { color: Colors.greenPrimary, fontSize: 15, fontWeight: "600" },
  successEmoji: { fontSize: 72, marginBottom: Spacing.md },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.neutralDark,
    textAlign: "center",
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    color: Colors.neutralMid,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.neutralMid,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: Spacing.lg,
  },
  pointsBadge: {
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
  },
  pointsText: { fontSize: 16, fontWeight: "700", color: "#F57F17" },
  doneBtn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 52,
    width: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  successIconCircle: { backgroundColor: Colors.greenLight },
  modalIcon: { fontSize: 28 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.neutralDark,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalBtn: {
    width: "100%",
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { color: Colors.white, fontSize: 15, fontWeight: "800" },
});
