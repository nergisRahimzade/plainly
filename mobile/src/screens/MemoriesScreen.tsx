import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Brain, FileText, MessageCircle, Trash2, AlertCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import ScreenHeader from "../components/ScreenHeader";
import { deleteMemory, listMemories } from "../lib/api";
import type { MemoryPublic } from "../types";
import { colors, fonts, radii } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Memories">;

export default function MemoriesScreen({ navigation }: Props) {
  const [memories, setMemories] = useState<MemoryPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setMemories(await listMemories());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load memories.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMemory(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that memory.");
      refresh();
    }
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader onMenuPress={() => navigation.goBack()} title="What Plainly remembers" showBack onBackPress={() => navigation.goBack()} />

      <Text style={styles.intro}>
        Plainly quietly notes short, standalone facts from your documents and chats — especially
        the reasons behind things — so it can answer follow-ups later. Delete anything you'd
        rather it forget.
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color={colors.brick} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : memories.length === 0 ? (
        <View style={styles.emptyBox}>
          <Brain size={22} color={colors.inkFaint} />
          <Text style={styles.emptyText}>
            Nothing remembered yet — upload a document or chat with Plainly to build this up.
          </Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                {item.sourceType === "chat" ? (
                  <MessageCircle size={13} color={colors.accent} />
                ) : (
                  <FileText size={13} color={colors.accent} />
                )}
              </View>
              <Text style={styles.cardText}>{item.content}</Text>
              <Pressable hitSlop={8} onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Trash2 size={14} color={colors.inkFaint} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  intro: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
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
  emptyBox: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.inkFaint, textAlign: "center", lineHeight: 20 },
  list: { padding: 16, paddingTop: 12, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    padding: 14,
  },
  cardIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  cardText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  deleteButton: { padding: 2, marginTop: 1 },
});
