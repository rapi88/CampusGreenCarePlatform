// Admin Reports
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import { adminApi } from "../../api/admin.api";

function formatDateInput(dateIso: string) {
  return dateIso.slice(0, 10);
}

function parseDateRangeInput(value: string, endOfDay = false) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

export default function AdminReportsScreen() {
  const navigation = useNavigation<any>();

  // Default to past 7 days for example
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString());
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromInput, setFromInput] = useState(() => formatDateInput(fromDate));
  const [toInput, setToInput] = useState(() => formatDateInput(toDate));
  const [dateError, setDateError] = useState("");

  const { data: reportsResponse, isLoading } = useQuery({
    queryKey: ["admin", "reports", fromDate, toDate],
    queryFn: () => adminApi.getWateringReport(fromDate, toDate),
  });

  const reports = reportsResponse?.data || [];

  const getTreeName = (item: any) => (
    item.treeName
    || item.tree?.name
    || (typeof item.tree === "string" ? item.tree : null)
    || "Bilinmeyen Ağaç"
  );

  const getUserName = (item: any) => (
    item.userName
    || item.user?.name
    || (typeof item.user === "string" ? item.user : null)
    || "Bilinmeyen Kullanıcı"
  );

  const openDateModal = () => {
    setFromInput(formatDateInput(fromDate));
    setToInput(formatDateInput(toDate));
    setDateError("");
    setShowDateModal(true);
  };

  const applyDateRange = () => {
    const nextFrom = parseDateRangeInput(fromInput);
    const nextTo = parseDateRangeInput(toInput, true);

    if (!nextFrom || !nextTo) {
      setDateError("Tarihleri YYYY-MM-DD formatında girin.");
      return;
    }

    if (new Date(nextFrom).getTime() > new Date(nextTo).getTime()) {
      setDateError("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
      return;
    }

    setFromDate(nextFrom);
    setToDate(nextTo);
    setShowDateModal(false);
  };

  const applyPreset = (days: number) => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    setFromDate(from.toISOString());
    setToDate(to.toISOString());
    setShowDateModal(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Sulama Raporları</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.datePicker} onPress={openDateModal}>
          <Text style={styles.dateText}>📅 Tarih Aralığı Seç</Text>
          <Text style={styles.dateRangeText}>
            {formatDateInput(fromDate)} - {formatDateInput(toDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colWide]}>Ağaç</Text>
        <Text style={styles.col}>Kullanıcı</Text>
        <Text style={styles.col}>GPS</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r: any) => r.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.colWide}>
                <Text style={styles.rowTree}>
                  {getTreeName(item)}
                </Text>
                <Text style={styles.rowDate}>
                  {new Date(item.wateredAt || item.date).toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.col, styles.rowUser]}>
                {getUserName(item)}
              </Text>
              <Text
                style={[
                  styles.col,
                  {
                    color: item.gpsVerified
                      ? Colors.greenPrimary
                      : Colors.error,
                    fontWeight: "700",
                  },
                ]}
              >
                {item.gpsVerified ? "✅" : "❌"}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: Spacing.xl }}>
              <Text style={{ color: Colors.neutralMid }}>
                Bu aralıkta sulama raporu bulunamadı.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tarih Aralığı</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.presetRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset(7)}>
                <Text style={styles.presetText}>Son 7 Gün</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => applyPreset(30)}>
                <Text style={styles.presetText}>Son 30 Gün</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Başlangıç</Text>
            <TextInput
              style={styles.dateInput}
              value={fromInput}
              onChangeText={(text) => {
                setFromInput(text);
                setDateError("");
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.neutralMid}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.inputLabel}>Bitiş</Text>
            <TextInput
              style={styles.dateInput}
              value={toInput}
              onChangeText={(text) => {
                setToInput(text);
                setDateError("");
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.neutralMid}
              keyboardType="numbers-and-punctuation"
            />

            {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}

            <TouchableOpacity style={styles.applyBtn} onPress={applyDateRange}>
              <Text style={styles.applyBtnText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.white,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: "500" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.neutralDark },
  dateRow: { padding: Spacing.md },
  datePicker: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.card,
  },
  dateText: { fontSize: 14, color: Colors.neutralDark, fontWeight: "600" },
  dateRangeText: {
    fontSize: 12,
    color: Colors.neutralMid,
    fontWeight: "500",
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.greenLight,
  },
  col: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.neutralMid,
    textTransform: "uppercase",
  },
  colWide: { flex: 2 },
  listContainer: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingBottom: 120 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  rowTree: { fontSize: 14, fontWeight: "600", color: Colors.neutralDark },
  rowDate: { fontSize: 11, color: Colors.neutralMid },
  rowUser: { fontSize: 13, color: Colors.neutralDark },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  dateModal: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.modal,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.neutralDark },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutralBg,
  },
  modalCloseText: { fontSize: 16, color: Colors.neutralMid, fontWeight: "700" },
  presetRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
  },
  presetText: { color: Colors.greenDark, fontSize: 13, fontWeight: "700" },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: Colors.neutralLight,
    borderRadius: Radius.md,
    backgroundColor: Colors.neutralBg,
    color: Colors.neutralDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  dateError: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  applyBtn: {
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    ...Shadow.card,
  },
  applyBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
});
