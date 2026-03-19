// Chat screen — volunteer group chat for a tree
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { TreeStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<TreeStackParamList, 'Chat'>;

interface Message { id: string; userId: string; userName: string; initial: string; text: string; time: string; }

const MY_USER_ID = 'me';

const MOCK_MSGS: Message[] = [
  { id: '1', userId: 'u1', userName: 'Mehmet Y.', initial: 'MY', text: 'Merhaba! Bugün ağacı suladım 💧', time: '10:32' },
  { id: '2', userId: 'u2', userName: 'Zeynep K.', initial: 'ZK', text: 'Harika! Ben yarın sabah sulayacağım.', time: '10:45' },
];

export default function ChatScreen({ route, navigation }: Props) {
  const { treeId, treeName } = route.params;
  const [messages, setMessages] = useState<Message[]>(MOCK_MSGS);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg: Message = {
      id: Date.now().toString(), userId: MY_USER_ID, userName: 'Sen', initial: 'BN',
      text: text.trim(), time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((m) => [...m, msg]);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const isMe = item.userId === MY_USER_ID;
            const showAvatar = !isMe && (index === 0 || messages[index - 1].userId !== item.userId);
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <View style={[styles.avatar, !showAvatar && styles.avatarInvisible]}>
                    <Text style={styles.avatarInitial}>{item.initial}</Text>
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  {showAvatar && !isMe && <Text style={styles.senderName}>{item.userName}</Text>}
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                  <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{item.time}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz…"
            value={text}
            onChangeText={setText}
            multiline
            placeholderTextColor={Colors.neutralMid}
          />
          <TouchableOpacity style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!text.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.neutralLight,
  },
  back: { color: Colors.greenPrimary, fontSize: 16, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.neutralDark },
  headerSub: { fontSize: 12, color: Colors.neutralMid },
  list: { padding: Spacing.md, gap: Spacing.sm },
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
