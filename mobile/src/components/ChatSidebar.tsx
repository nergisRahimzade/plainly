import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, FlatList } from "react-native";
import { Plus, Trash2, MessageCircle } from "lucide-react-native";
import { colors, fonts, radii } from "../theme";
import type { ConversationSummaryPublic } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

interface ChatSidebarProps {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationSummaryPublic[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  footer?: React.ReactNode;
}

export default function ChatSidebar({
  visible,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  footer,
}: ChatSidebarProps) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: visible ? 0 : -SIDEBAR_WIDTH, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Ask Plainly about your documents.</Text>

          <Pressable
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            onPress={() => {
              onNewChat();
              onClose();
            }}
          >
            <Plus size={14} color={colors.paper} strokeWidth={2.5} />
            <Text style={styles.newButtonText}>New chat</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          {conversations.length === 0 ? (
            <View style={styles.emptyBox}>
              <MessageCircle size={20} color={colors.inkFaint} />
              <Text style={styles.emptyText}>Your past conversations will show up here.</Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isSelected = item.id === activeId;
                return (
                  <Pressable
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => onDelete(item.id)} style={styles.deleteButton}>
                      <Trash2 size={14} color={colors.inkFaint} />
                    </Pressable>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        {footer}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(34,31,28,0.25)" },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.ink },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  newButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: 11,
  },
  newButtonText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.paper },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginBottom: 2,
  },
  rowSelected: { backgroundColor: colors.accentSoft },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink },
  rowSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  deleteButton: { padding: 4 },
  emptyBox: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20, gap: 10 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint, textAlign: "center", lineHeight: 19 },
});
