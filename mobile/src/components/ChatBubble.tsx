import { View, Text, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { Sparkles } from "lucide-react-native";
import type { ChatMessagePublic } from "../types";
import { colors, fonts, radii } from "../theme";

interface ChatBubbleProps {
  message: ChatMessagePublic;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowModel]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Sparkles size={12} color={colors.paper} strokeWidth={2.5} />
        </View>
      )}
      <View style={{ maxWidth: "82%" }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
          {isUser ? (
            <Text style={styles.userText}>{message.content}</Text>
          ) : (
            <Markdown style={markdownStyles}>{message.content}</Markdown>
          )}
        </View>
        {!isUser && message.contextDocs && message.contextDocs.length > 0 && (
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>From your history:</Text>
            <View style={styles.contextChips}>
              {message.contextDocs.map((d) => (
                <View key={d.id} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {d.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 14 },
  rowUser: { justifyContent: "flex-end" },
  rowModel: { justifyContent: "flex-start" },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  bubble: { borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: colors.ink, borderBottomRightRadius: 4 },
  bubbleModel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderBottomLeftRadius: 4 },
  userText: { fontFamily: fonts.sans, fontSize: 15, color: colors.paper, lineHeight: 21 },
  contextRow: { marginTop: 6, paddingLeft: 2 },
  contextLabel: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.inkFaint, marginBottom: 4 },
  contextChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: 180,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.accent },
});

const markdownStyles = StyleSheet.create({
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 21 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  bullet_list: { marginTop: 2, marginBottom: 2 },
  list_item: { marginTop: 2 },
  strong: { fontFamily: fonts.sansSemiBold, color: colors.ink },
});
