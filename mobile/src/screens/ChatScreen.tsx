import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Send, Home, Sparkles, AlertCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import ScreenHeader from "../components/ScreenHeader";
import ChatSidebar from "../components/ChatSidebar";
import ChatBubble from "../components/ChatBubble";
import {
  deleteConversation,
  getConversation,
  listConversations,
  sendChatMessage,
} from "../lib/api";
import type { ChatMessagePublic, ConversationPublic, ConversationSummaryPublic } from "../types";
import { colors, fonts, radii } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

const SUGGESTIONS = [
  "What should I do first about my most recent upload?",
  "Why did I need to contact anyone about this?",
  "Summarize everything I've uploaded so far.",
];

export default function ChatScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<ConversationSummaryPublic[]>([]);
  const [active, setActive] = useState<ConversationPublic | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessagePublic>>(null);

  useEffect(() => {
    refreshConversations();
  }, []);

  async function refreshConversations() {
    try {
      setConversations(await listConversations());
    } catch {
      // Chat history is a nice-to-have; a failed fetch shouldn't block chatting.
    }
  }

  async function handleSelectConversation(id: string) {
    setError(null);
    try {
      setActive(await getConversation(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that conversation.");
    }
  }

  async function handleDeleteConversation(id: string) {
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (active?.id === id) setActive(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that conversation.");
    }
  }

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || isSending) return;
      setError(null);
      setInput("");

      // Optimistically show the user's message immediately.
      setActive((prev) => {
        const optimisticUser: ChatMessagePublic = { role: "user", content: text, createdAt: new Date().toISOString() };
        if (prev) return { ...prev, messages: [...prev.messages, optimisticUser] };
        return {
          id: "pending",
          title: text,
          messages: [optimisticUser],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      setIsSending(true);

      try {
        const conversationId = active && active.id !== "pending" ? active.id : undefined;
        const result = await sendChatMessage(text, conversationId);
        setActive(result);
        refreshConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send that message. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, active]
  );

  const messages = active?.messages ?? [];

  return (
    <View style={styles.safe}>
      <ScreenHeader
        onMenuPress={() => setIsSidebarOpen(true)}
        title="Chat"
        right={
          <Pressable style={styles.homeButton} onPress={() => navigation.goBack()} hitSlop={8}>
            <Home size={16} color={colors.ink} />
          </Pressable>
        }
      />

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color={colors.brick} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles size={20} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Ask Plainly anything</Text>
            <Text style={styles.emptySubtitle}>
              Follow up on a document, get help deciding what to do next, or ask Plainly to
              remind you why you did something.
            </Text>
            <View style={{ marginTop: 20, gap: 8, width: "100%" }}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestionChip} onPress={() => handleSend(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {isSending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.typingText}>Plainly is thinking…</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your documents…"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            multiline
            onSubmitEditing={() => handleSend()}
          />
          <Pressable
            style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isSending}
          >
            <Send size={16} color={colors.paper} strokeWidth={2.25} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ChatSidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeId={active?.id ?? null}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={() => setActive(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  homeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.brickSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.brick}40`,
  },
  errorText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.brick },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.ink },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestionText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink },
  messageList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingBottom: 6 },
  typingText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.inkFaint },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
});
