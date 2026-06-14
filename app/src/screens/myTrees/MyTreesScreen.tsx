// My Trees screen — list of adopted trees
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import StatusChip from "../../components/common/StatusChip";
import { relativeTime, computeHydrationStatus } from "../../utils/formatters";
import { treesApi } from "../../api/trees.api";
import { useAuthStore } from "../../store/auth.store";

export default function MyTreesScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<"adopted" | "suggested">(
    "adopted",
  );

  const { data: myTreesResponse, isLoading, refetch } = useQuery({
    queryKey: ["my-trees"],
    queryFn: () => treesApi.getMyTrees(),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const dismissMutation = useMutation({
    mutationFn: (id: string) => treesApi.dismissSuggestion(id),
    onMutate: async (dismissedTreeId) => {
      await queryClient.cancelQueries({ queryKey: ["my-trees"] });
      const previousMyTrees = queryClient.getQueryData(["my-trees"]);

      queryClient.setQueryData(["my-trees"], (oldData: any) => {
        if (!oldData?.data?.suggested) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            suggested: oldData.data.suggested.filter(
              (tree: any) =>
                tree.id !== dismissedTreeId &&
                tree.suggestionId !== dismissedTreeId,
            ),
          },
        };
      });

      return { previousMyTrees };
    },
    onSuccess: (_response, dismissedId) => {
      queryClient.setQueryData(["my-trees"], (oldData: any) => {
        if (!oldData?.data?.suggested) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            suggested: oldData.data.suggested.filter(
              (tree: any) =>
                tree.id !== dismissedId && tree.suggestionId !== dismissedId,
            ),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ["my-trees"] });
      Toast.show({
        type: "success",
        text1: "Kaldırıldı",
        text2: "Öneri kaldırıldı.",
      });
    },
    onError: (_error, _dismissedId, context) => {
      if (context?.previousMyTrees) {
        queryClient.setQueryData(["my-trees"], context.previousMyTrees);
      }
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Öneri kaldırılamadı.",
      });
    },
  });

  const handleDismiss = (id: string) => {
    if (dismissMutation.isPending) return;
    dismissMutation.mutate(id);
  };

  const adoptedTrees = myTreesResponse?.data?.adopted || [];
  const suggestedTrees = myTreesResponse?.data?.suggested || [];
  const selectedTab = isAdmin ? "adopted" : activeTab;
  const displayData = selectedTab === "adopted" ? adoptedTrees : suggestedTrees;
  const getApprovalStatus = (item: (typeof displayData)[number]) =>
    item.approvalStatus || item.status;
  const statusLabel = (status: string) =>
    ({
      ACTIVE: "Aktif",
      PENDING: "Beklemede",
      DENIED: "Reddedildi",
      REMOVED: "Kaldırıldı",
    })[status] ?? status;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>🌲 Ağaçlarım</Text>
        <Text style={styles.subtitle}>
          {adoptedTrees.length}/10 ağaç sahiplenildi
        </Text>
      </View>

      {!isAdmin && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "adopted" && styles.activeTab]}
            onPress={() => setActiveTab("adopted")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "adopted" && styles.activeTabText,
              ]}
            >
              Sahiplenilen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "suggested" && styles.activeTab]}
            onPress={() => setActiveTab("suggested")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "suggested" && styles.activeTabText,
              ]}
            >
              Önerilen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addTreeTab}
            onPress={() => navigation.navigate("SuggestTree")}
          >
            <Text style={styles.addTreeTabText}>Ağaç Ekle+</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(t) => t.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                const approvalStatus = getApprovalStatus(item);
                if (selectedTab === "adopted" || approvalStatus === "ACTIVE") {
                  navigation.navigate("TreeDetail", { treeId: item.id });
                }
              }}
              activeOpacity={selectedTab === "suggested" && getApprovalStatus(item) !== "ACTIVE" ? 1 : 0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardEmoji}>🌳</Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {selectedTab === "adopted" ? (
                    <StatusChip
                      status={computeHydrationStatus(
                        item.lastWateredAt,
                        item.wateringPeriodDays,
                      )}
                      size="sm"
                    />
                  ) : (
                    <StatusChip status={getApprovalStatus(item)} size="sm" />
                  )}
                </View>
                <Text style={styles.cardLoc}>📍 {item.location}</Text>

                {selectedTab === "adopted" && (
                  <Text style={styles.cardWatered}>
                    💧{" "}
                    {item.lastWateredAt
                      ? relativeTime(item.lastWateredAt)
                      : "Hiç"}
                  </Text>
                )}

                {selectedTab === "suggested" && (
                  <>
                    <Text style={styles.cardWatered}>
                      Durum: {statusLabel(getApprovalStatus(item))}
                    </Text>
                    {getApprovalStatus(item) === "DENIED" ? (
                      <View style={styles.rejectReasonBox}>
                        <Text style={styles.rejectReasonLabel}>Reddetme sebebi</Text>
                        <Text style={styles.rejectReasonText}>
                          {item.rejectionReason || "Sebep belirtilmedi."}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
              {selectedTab === "suggested" &&
                (getApprovalStatus(item) === "DENIED" ||
                  getApprovalStatus(item) === "REMOVED" ||
                  getApprovalStatus(item) === "ACTIVE") && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[
                        styles.leaveBtn,
                        dismissMutation.isPending && styles.leaveBtnDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleDismiss(item.id);
                      }}
                      disabled={dismissMutation.isPending}
                    >
                      <Text style={styles.leaveText}>Kaldır</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>
                {selectedTab === "adopted"
                  ? "Henüz hiç ağaç sahiplenmediniz"
                  : "Öneri bulunamadı"}
              </Text>
              <Text style={styles.emptyDesc}>
                {selectedTab === "adopted"
                  ? "Harita ekranından bir ağaç sahiplenebilirsiniz."
                  : "Önerdiğiniz ağaçlar burada görünür."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: "800", color: Colors.neutralDark },
  subtitle: { fontSize: 13, color: Colors.neutralMid, marginTop: 2 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
  },
  activeTab: { backgroundColor: Colors.greenPrimary },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.neutralMid },
  activeTabText: { color: Colors.white },
  addTreeTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.greenLight,
    borderWidth: 1,
    borderColor: Colors.greenPrimary,
  },
  addTreeTabText: { fontSize: 14, fontWeight: "700", color: Colors.greenDark },
  listContainer: { flex: 1 },
  list: { flexGrow: 1, padding: Spacing.md, gap: Spacing.sm, paddingBottom: 120 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  cardLeft: {
    width: 60,
    height: 60,
    backgroundColor: Colors.greenLight,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardEmoji: { fontSize: 30 },
  cardInfo: { flex: 1 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutralDark,
    flex: 1,
    marginRight: 8,
  },
  cardLoc: { fontSize: 12, color: Colors.neutralMid, marginBottom: 2 },
  cardWatered: { fontSize: 12, color: Colors.neutralMid },
  rejectReasonBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  rejectReasonLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.error,
    marginBottom: 2,
  },
  rejectReasonText: { fontSize: 12, color: Colors.neutralDark, lineHeight: 17 },
  cardActions: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 8,
  },
  leaveBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  leaveBtnDisabled: { opacity: 0.5 },
  leaveText: { color: Colors.white, fontWeight: "700", fontSize: 12 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.neutralMid,
    textAlign: "center",
    lineHeight: 20,
  },
});
