// Chat screen — volunteer group chat for a tree
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';
import { chatApi } from '../../api/chat.api';
import { useAuthStore } from '../../store/auth.store';

type Props = NativeStackScreenProps<TreeStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { treeId, treeName } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: messagesResponse, isLoading } = useQuery({
    queryKey: ['tree', treeId, 'chat'],
    queryFn: () => chatApi.getMessages(treeId),
    refetchInterval: 5000, // simple polling
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => chatApi.sendMessage(treeId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree', treeId, 'chat'] });
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Mesaj gönderilemedi.' });
    }
  });

  const messages = messagesResponse?.data || [];

  const sendMessage = () => {
    if (!text.trim()) return;
    sendMessageMutation.mutate(text.trim());
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Geri</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{treeName}</Text>
          <Text style={styles.headerSub}>Gönüllü Sohbeti</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.greenPrimary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.listContainer}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isMe = item.userId === user?.id;
              const showAvatar = !isMe && (index === 0 || messages[index - 1].userId !== item.userId);
              return (
                <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  {!isMe && (
                    <View style={[styles.avatar, !showAvatar && styles.avatarInvisible]}>
                      <Text style={styles.avatarInitial}>{item.userName?.charAt(0) || 'U'}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    {showAvatar && !isMe && <Text style={styles.senderName}>{item.userName}</Text>}
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yazin…"
            value={text}
            onChangeText={setText}
            multiline
            placeholderTextColor={Colors.neutralMid}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!text.trim() || sendMessageMutation.isPending) && styles.sendBtnDisabled]} 
            onPress={sendMessage} 
            disabled={!text.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  headerSub: { fontSize: 12, color: Colors.neutralMid },
  listContainer: { flex: 1 },
  list: { flexGrow: 1, padding: Spacing.md, gap: Spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  avatarInvisible: { opacity: 0 },
  avatarInitial: { fontSize: 13, fontWeight: '700', color: Colors.greenDark },
  bubble: { maxWidth: '72%', borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleOther: { backgroundColor: Colors.white, borderBottomLeftRadius: Radius.sm, ...Shadow.card },
  bubbleMe: { backgroundColor: Colors.greenPrimary, borderBottomRightRadius: Radius.sm },
  senderName: { fontSize: 11, fontWeight: '700', color: Colors.greenDark, marginBottom: 2 },
  msgText: { fontSize: 15, color: Colors.neutralDark },
  msgTextMe: { color: Colors.white },
  msgTime: { fontSize: 10, color: Colors.neutralMid, marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.neutralLight, gap: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: Colors.neutralBg, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 15, maxHeight: 120,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.greenPrimary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.neutralLight },
  sendIcon: { color: Colors.white, fontSize: 18 },
});
