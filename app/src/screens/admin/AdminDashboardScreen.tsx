// Admin Dashboard
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import ScaleButton from "../../components/common/ScaleButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import { useAuthStore } from "../../store/auth.store";
import { adminApi } from "../../api/admin.api";

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { clearAuth } = useAuthStore();

  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
  });

  const stats = statsResponse?.data || {
    totalTrees: 0,
    activeVolunteers: 0,
    wateringsToday: 0,
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    clearAuth();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Admin Paneli</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Stats grid */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.greenPrimary}
            style={{ marginVertical: Spacing.xl }}
          />
        ) : (
          <View style={styles.statsGrid}>
            <ScaleButton
              style={styles.statCard}
              onPress={() => navigation.navigate("AdminTreeList")}
            >
              <Text style={styles.statIcon}>🌳</Text>
              <Text style={styles.statValue}>{stats.totalTrees || 0}</Text>
              <Text style={styles.statLabel}>Toplam Ağaç</Text>
            </ScaleButton>
            <ScaleButton
              style={styles.statCard}
              onPress={() => navigation.navigate("AdminUserManagement")}
            >
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>
                {stats.activeVolunteers || 0}
              </Text>
              <Text style={styles.statLabel}>Gönüllüler</Text>
            </ScaleButton>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statValue}>{stats.wateringsToday || 0}</Text>
              <Text style={styles.statLabel}>Bugünkü Sulamalar</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        {/* Quick actions */}
        {[
          {
            icon: "🌟 Ağaç Önerileri",
            screen: "AdminTreeSuggestions",
            params: {},
          },
          { icon: "+ Ağaç Ekle", screen: "AdminAddEditTree", params: {} },
          { icon: "🌳 Ağaç Listesi", screen: "AdminTreeList", params: {} },
          { icon: "📊 Sulama Raporları", screen: "AdminReports", params: {} },
          {
            icon: "👥 Kullanıcı Yönetimi",
            screen: "AdminUserManagement",
            params: {},
          },
          ...(process.env.EXPO_PUBLIC_NOTIFICATION_DEBUG === "true"
            ? [
                {
                  icon: "🔔 Bildirim Test Merkezi",
                  screen: "AdminNotificationTest",
                  params: {},
                },
              ]
            : []),
        ].map((a) => (
          <ScaleButton
            key={a.icon}
            style={styles.actionBtn}
            onPress={() => navigation.navigate(a.screen, a.params)}
          >
            <Text style={styles.actionBtnText}>{a.icon}</Text>
            <Text style={styles.actionArrow}>›</Text>
          </ScaleButton>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  title: { fontSize: 22, fontWeight: "800", color: Colors.neutralDark },
  logout: { color: Colors.error, fontWeight: "600", fontSize: 15 },
  content: { flexGrow: 1, padding: Spacing.md, paddingBottom: 120 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  statIcon: { fontSize: 28, marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: "800", color: Colors.neutralDark },
  statLabel: {
    fontSize: 12,
    color: Colors.neutralMid,
    textAlign: "center",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  actionBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.neutralDark,
  },
  actionArrow: { fontSize: 22, color: Colors.neutralLight },
});
