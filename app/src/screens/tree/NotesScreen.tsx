// Notes screen — per-tree notes list
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { Colors } from "../../theme/colors";
import { Spacing, Radius, Shadow } from "../../theme/spacing";
import { relativeTime } from "../../utils/formatters";
import { TreeStackParamList } from "../../navigation/MainTabs";
import { notesApi } from "../../api/notes.api";

type Props = NativeStackScreenProps<TreeStackParamList, "Notes">;

export default function NotesScreen({ route, navigation }: Props) {
  const { treeId, treeName } = route.params;
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  const { data: notesResponse, isLoading } = useQuery({
    queryKey: ["tree", treeId, "notes"],
    queryFn: () => notesApi.getNotes(treeId),
  });

  const addNoteMutation = useMutation({
    mutationFn: (text: string) => notesApi.addNote(treeId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tree", treeId, "notes"] });
      setNewNoteText("");
      setModalVisible(false);
      Toast.show({ type: "success", text1: "Başarılı", text2: "Not eklendi." });
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Hata", text2: "Not eklenemedi." });
    },
  });

  const notes = notesResponse?.data || [];

  const addNote = () => {
    if (!newNoteText.trim()) return;
    addNoteMutation.mutate(newNoteText.trim());
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{treeName} — Notlar</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {item.userName?.charAt(0) || "U"}
                  </Text>
                </View>
                <View style={styles.noteMeta}>
                  <Text style={styles.noteName}>{item.userName}</Text>
                  <Text style={styles.noteTime}>
                    {relativeTime(item.createdAt)}
                  </Text>
                </View>
              </View>
              <Text style={styles.noteText}>{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>Henüz not eklenmedi</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+ Not Ekle</Text>
      </TouchableOpacity>

      {/* Add note modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Not Ekle</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ağaç hakkında bir not ekleyin…"
                value={newNoteText}
                onChangeText={setNewNoteText}
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.neutralMid}
                autoFocus
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    (!newNoteText.trim() || addNoteMutation.isPending) &&
                      styles.saveBtnDisabled,
                  ]}
                  onPress={addNote}
                  disabled={!newNoteText.trim() || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.saveText}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 15, fontWeight: "600", color: Colors.neutralDark },
  listContainer: { flex: 1 },
  list: {
    flexGrow: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 140,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitial: { fontSize: 14, fontWeight: "700", color: Colors.greenDark },
  noteMeta: {},
  noteName: { fontSize: 13, fontWeight: "600", color: Colors.neutralDark },
  noteTime: { fontSize: 11, color: Colors.neutralMid },
  noteText: { fontSize: 14, color: Colors.neutralDark, lineHeight: 20 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.neutralMid },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: Colors.greenPrimary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.full,
    ...Shadow.modal,
  },
  fabText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.neutralDark,
    marginBottom: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
  },
  modalBtns: { flexDirection: "row", gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.md,
  },
  cancelText: { color: Colors.neutralMid, fontWeight: "600", fontSize: 15 },
  saveBtn: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.greenPrimary,
    borderRadius: Radius.md,
  },
  saveBtnDisabled: { backgroundColor: Colors.neutralLight },
  saveText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
