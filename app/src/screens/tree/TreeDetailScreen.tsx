// Tree Detail Screen
import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import ScaleButton from "../../components/common/ScaleButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import StatusChip from "../../components/common/StatusChip";
import { formatDate, relativeTime } from "../../utils/formatters";
import { TreeStackParamList } from "../../navigation/MainTabs";
import { treesApi } from "../../api/trees.api";
import { useAuthStore } from "../../store/auth.store";

type Props = NativeStackScreenProps<TreeStackParamList, "TreeDetail">;

function formatOptionalMeasurement(value: number | null | undefined, unit: string) {
  return value && value > 0 ? `${value} ${unit}` : "Bilinmiyor";
}

export default function TreeDetailScreen({ route, navigation }: Props) {
  const { treeId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const {
    data: treeResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tree", treeId],
    queryFn: () => treesApi.getById(treeId),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const leaveAdoptionMutation = useMutation({
    mutationFn: () => treesApi.leaveAdoption(treeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree", treeId] });
      queryClient.invalidateQueries({ queryKey: ["trees"] });
      Toast.show({
        type: "success",
        text1: "Başarılı",
        text2: "Bu ağacın sahiplenmesini bıraktınız.",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Ağaç sahiplenmesi bırakılamadı.",
      });
    },
  });

  const tree = treeResponse?.data;
  const isAdoptedByMe =
    tree?.volunteers?.some((v) => v.id === user?.id) || false;

  const showVolunteerOnlyMessage = () => {
    Toast.show({
      type: "info",
      text1: "Erişim yok",
      text2: "Bu ağaca gönüllü olmadığınız için bu kısma erişiminiz yok.",
    });
  };

  const navigateIfVolunteer = (screen: "Chat" | "Notes") => {
    if (!tree) return;
    if (!isAdoptedByMe) {
      showVolunteerOnlyMessage();
      return;
    }
    navigation.navigate(screen, { treeId, treeName: tree.name });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerSafe}>
        <ActivityIndicator size="large" color={Colors.greenPrimary} />
      </SafeAreaView>
    );
  }

  if (isError || !tree) {
    return (
      <SafeAreaView style={styles.centerSafe}>
        <Text style={styles.errorText}>Ağaç detaylari yüklenemedi.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtnHeader}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ağaç #{tree.id.slice(-4)}</Text>
        {user?.role === "ADMIN" ? (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() =>
              (navigation as any).navigate("AdminAddEditTree", { treeId })
            }
          >
            <Text style={styles.editAdminText}>✏️ Düzenle</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.moreBtn} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {tree.photoUrl ? (
            <Image source={{ uri: tree.photoUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={styles.heroEmoji}>🌳</Text>
            </View>
          )}
          {tree.isNaturalMonument && (
            <View style={styles.monumentBadge}>
              <Text style={styles.monumentText}>🌿 Doğal Anıt</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.treeName}>{tree.name}</Text>
            <StatusChip status={tree.health} />
          </View>
          <Text style={styles.species}>{tree.species}</Text>
          <Text style={styles.location}>📍 {tree.location}</Text>

          {/* Last watering card */}
          <View style={styles.wateringCard}>
            <View style={styles.wateringLeft}>
              <Text style={styles.wateringIcon}>📅</Text>
              <View>
                <Text style={styles.wateringLabel}>SON SULAMA</Text>
                <Text style={styles.wateringDate}>
                  {tree.lastWateredAt ? formatDate(tree.lastWateredAt) : "Hiç"}
                </Text>
              </View>
            </View>
            <Text style={styles.wateringRelative}>
              {tree.lastWateredAt ? relativeTime(tree.lastWateredAt) : "-"}
            </Text>
          </View>

          {/* Info grid */}
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Tahmini Yaş</Text>
              <Text style={styles.gridValue}>{formatOptionalMeasurement(tree.estimatedAge, "Yıl")}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Boy</Text>
              <Text style={styles.gridValue}>{formatOptionalMeasurement(tree.height, "Metre")}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Sulama Periyodu</Text>
              <Text style={styles.gridValue}>
                {tree.wateringPeriodDays} Gün
              </Text>
            </View>
            <TouchableOpacity
              style={styles.gridCell}
              onPress={() => navigation.navigate("Adoption", { treeId })}
            >
              <Text style={styles.gridLabel}>Gönüllüler</Text>
              <Text style={styles.gridValue}>
                {tree.volunteerCount}/{tree.maxVolunteers}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Adoption Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🤝</Text>
              <Text style={styles.sectionTitle}>Sahiplenme Bilgisi</Text>
            </View>
            <TouchableOpacity
              style={styles.caretakerRow}
              onPress={() => navigation.navigate("Adoption", { treeId })}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{"?"}</Text>
              </View>
              <View style={styles.caretakerInfo}>
                <Text style={styles.caretakerName}>Gönüllüler</Text>
                <Text style={styles.caretakerBadge}>
                  {tree.volunteerCount} kullanıcı sahiplendi
                </Text>
              </View>
              {tree.isAdopted ? (
                <Text style={styles.profileLink}>Sahiplenildi ›</Text>
              ) : (
                <Text style={styles.profileLink}>Uygun ›</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick action buttons: Chat & Notes */}
          <View style={styles.quickActions}>
            <ScaleButton
              style={styles.quickActionBtn}
              onPress={() => navigateIfVolunteer("Chat")}
            >
              <Text style={styles.quickActionEmoji}>💬</Text>
              <Text style={styles.quickActionText}>Sohbet</Text>
            </ScaleButton>
            <ScaleButton
              style={styles.quickActionBtn}
              onPress={() => navigateIfVolunteer("Notes")}
            >
              <Text style={styles.quickActionEmoji}>📝</Text>
              <Text style={styles.quickActionText}>Notlar</Text>
            </ScaleButton>
            {isAdoptedByMe ? (
              <ScaleButton
                style={styles.quickActionBtn}
                onPress={() => leaveAdoptionMutation.mutate()}
                disabled={leaveAdoptionMutation.isPending}
              >
                {leaveAdoptionMutation.isPending ? (
                  <ActivityIndicator color={Colors.error} />
                ) : (
                  <>
                    <Text style={styles.quickActionEmoji}>👋</Text>
                    <Text
                      style={[styles.quickActionText, { color: Colors.error }]}
                    >
                      Bırak
                    </Text>
                  </>
                )}
              </ScaleButton>
            ) : (
              <ScaleButton
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate("Adoption", { treeId })}
              >
                <Text style={styles.quickActionEmoji}>🤝</Text>
                <Text style={styles.quickActionText}>Sahiplen</Text>
              </ScaleButton>
            )}
          </View>

          {/* Primary CTA */}
          <ScaleButton
            style={styles.waterBtn}
            onPress={() => navigation.navigate("Watering", { treeId })}
          >
            <Text style={styles.waterBtnText}>🚿 Ağacı Sula</Text>
          </ScaleButton>

          {/* Eco info */}
          <View style={styles.ecoBox}>
            <Text style={styles.ecoText}>
              ℹ️ Bu ağaç yerel ekosistemin bir parçasıdır. Sulama yaparken
              çevreyi kirletmemeye özen gösterin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
  centerSafe: {
    flex: 1,
    backgroundColor: Colors.neutralBg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontSize: 16, color: Colors.neutralMid, marginBottom: 16 },
  backBtn: {
    padding: 12,
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
  },
  backBtnText: { color: Colors.white, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  backBtnHeader: { padding: 8 },
  backIcon: { fontSize: 28, color: Colors.neutralDark, fontWeight: "300" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.neutralDark },
  moreBtn: { padding: 8, minWidth: 60, alignItems: "flex-end" },
  moreIcon: { fontSize: 22, color: Colors.neutralDark },
  editAdminText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.greenPrimary,
  },
  heroContainer: { position: "relative" },
  heroImage: { height: 240, width: "100%", resizeMode: "cover" },
  heroImagePlaceholder: {
    height: 240,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: { fontSize: 80 },
  monumentBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.greenPrimary,
  },
  monumentText: { fontSize: 12, color: Colors.greenDark, fontWeight: "600" },
  body: { padding: Spacing.md },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  treeName: { fontSize: 26, fontWeight: "700", color: Colors.neutralDark },
  species: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.neutralMid,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.neutralMid,
    marginBottom: Spacing.md,
  },
  wateringCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  wateringLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  wateringIcon: { fontSize: 28 },
  wateringLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.neutralMid,
    letterSpacing: 0.5,
  },
  wateringDate: { fontSize: 18, fontWeight: "700", color: Colors.greenDark },
  wateringRelative: { fontSize: 13, color: Colors.neutralMid },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  gridCell: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.card,
  },
  gridLabel: { fontSize: 11, color: Colors.neutralMid, marginBottom: 4 },
  gridValue: { fontSize: 16, fontWeight: "600", color: Colors.neutralDark },
  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: Colors.neutralDark },
  caretakerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: Colors.greenDark },
  caretakerInfo: { flex: 1 },
  caretakerName: { fontSize: 15, fontWeight: "600", color: Colors.neutralDark },
  caretakerBadge: { fontSize: 12, color: Colors.neutralMid },
  profileLink: { fontSize: 14, fontWeight: "600", color: Colors.greenPrimary },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: "center",
    ...Shadow.card,
  },
  quickActionEmoji: { fontSize: 22, marginBottom: 4 },
  quickActionText: {
    fontSize: 12,
    color: Colors.neutralDark,
    fontWeight: "500",
  },
  waterBtn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  waterBtnText: { color: Colors.white, fontSize: 17, fontWeight: "700" },

  ecoBox: {
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  ecoText: { fontSize: 12, color: Colors.neutralMid, lineHeight: 18 },
});
