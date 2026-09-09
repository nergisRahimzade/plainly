import { FlatList, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { Trash2 } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";
import { colors } from "../theme";

interface HistoryListProps {
  documents: PlainlyDocumentPublic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}

export default function HistoryList({
  documents,
  selectedId,
  onSelect,
  onDelete,
  emptyMessage,
}: HistoryListProps) {
  if (documents.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        const meta = getDocTypeMeta(item.docType);
        const Icon = meta.icon;
        const isSelected = item.id === selectedId;
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            style={[styles.row, isSelected && styles.rowSelected]}
          >
            <View style={styles.rowIcon}>
              <Icon size={14} color={meta.color} strokeWidth={1.75} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {item.summary}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => {
                Alert.alert("Delete this upload?", item.title, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
                ]);
              }}
              style={styles.trash}
              accessibilityLabel="Delete"
            >
              <Trash2 size={14} color={colors.inkFaint} strokeWidth={1.75} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rowSelected: { backgroundColor: colors.accentSoft },
  rowIcon: { marginTop: 2 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: "500", color: colors.ink },
  rowSubtitle: { fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  trash: { marginTop: 2, padding: 4 },
  emptyBox: { paddingVertical: 40, paddingHorizontal: 12 },
  emptyText: { fontSize: 14, lineHeight: 20, color: colors.inkFaint, textAlign: "center" },
});
