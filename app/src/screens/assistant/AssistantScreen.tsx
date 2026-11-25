import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useMutation } from '@tanstack/react-query';
import { assistantApi } from '../../api/assistant.api';
import { Colors } from '../../theme/colors';
import { Radius, Shadow, Spacing } from '../../theme/spacing';

type Message = {
  id: string;
  text: string;
  role: 'assistant' | 'user';
  topic?: string;
};

function TypingIndicator() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((count) => (count % 3) + 1);
    }, 450);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.typingBubble}>
      <Text style={styles.typingText}>{'.'.repeat(dotCount)}</Text>
    </View>
  );
}

const quickQuestions = [
  'Meşe ağaçları ne sıklıkla sulanır?',
  'Ağaçlar ne zaman budanır?',
  'Gübreleme nasıl yapılır?',
];

const initialMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  topic: 'Bitki Asistanı',
  text: 'Merhaba! Kampüs ağaçlarının bakımı hakkında sorularını yanıtlayabilirim. 🌿',
};

export default function AssistantScreen() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const listRef = useRef<FlatList<Message>>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const askMutation = useMutation({
    mutationFn: (value: string) => assistantApi.ask(value),
    onSuccess: ({ data }, value) => {
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-answer`, role: 'assistant', topic: data.topic, text: data.answer },
      ]);
      setQuestion('');
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Yanıt alınamadı',
        text2: 'Lütfen bağlantınızı kontrol edip tekrar deneyin.',
      });
    },
  });

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timer);
  }, [messages, askMutation.isPending]);

  const ask = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || askMutation.isPending) return;

    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-question`, role: 'user', text: trimmed },
    ]);
    setQuestion('');
    askMutation.mutate(trimmed);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🌱</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Bitki Asistanı</Text>
          <Text style={styles.headerSubtitle}>Kampüs bakım rehberin</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
                {!isUser && <Text style={styles.botAvatar}>🌿</Text>}
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                  {!isUser && item.topic && <Text style={styles.topic}>{item.topic}</Text>}
                  <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <>
              {askMutation.isPending && (
                <View style={styles.messageRow}>
                  <Text style={styles.botAvatar}>🌿</Text>
                  <TypingIndicator />
                </View>
              )}
              {messages.length === 1 ? (
                <View style={styles.quickQuestions}>
                  <Text style={styles.quickTitle}>Hızlı sorular</Text>
                  {quickQuestions.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.quickQuestion}
                      onPress={() => ask(item)}
                      disabled={askMutation.isPending}
                    >
                      <Text style={styles.quickQuestionText}>{item}</Text>
                      <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </>
          }
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Bir soru sor..."
            placeholderTextColor={Colors.neutralMid}
            multiline
            maxLength={500}
            onSubmitEditing={() => ask()}
            blurOnSubmit
          />
          <TouchableOpacity
            style={[styles.sendButton, (!question.trim() || askMutation.isPending) && styles.disabled]}
            onPress={() => ask()}
            disabled={!question.trim() || askMutation.isPending}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.neutralBg },
  keyboard: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.neutralDark },
  headerSubtitle: { fontSize: 12, color: Colors.neutralMid, marginTop: 2 },
  messageList: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.lg },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  userMessageRow: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
  },
  bubble: { maxWidth: '82%', borderRadius: Radius.lg, padding: Spacing.md },
  botBubble: { backgroundColor: Colors.white, borderBottomLeftRadius: Radius.sm, ...Shadow.card },
  typingBubble: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    ...Shadow.card,
  },
  typingText: { color: Colors.greenPrimary, fontSize: 12, letterSpacing: 2 },
  userBubble: { backgroundColor: Colors.greenPrimary, borderBottomRightRadius: Radius.sm },
  topic: { fontSize: 12, fontWeight: '700', color: Colors.greenDark, marginBottom: Spacing.xs },
  messageText: { fontSize: 15, lineHeight: 22, color: Colors.neutralDark },
  userMessageText: { color: Colors.white },
  quickQuestions: { marginLeft: 40, marginTop: Spacing.sm, gap: Spacing.sm },
  quickTitle: { fontSize: 13, fontWeight: '700', color: Colors.neutralMid },
  quickQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
    ...Shadow.card,
  },
  quickQuestionText: { flex: 1, fontSize: 13, color: Colors.neutralDark },
  arrow: { fontSize: 22, color: Colors.greenPrimary, marginLeft: Spacing.sm },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralLight,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    backgroundColor: Colors.neutralBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.neutralDark,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.greenPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { backgroundColor: Colors.neutralLight },
  sendIcon: { color: Colors.white, fontSize: 24, fontWeight: '700', lineHeight: 26 },
});
