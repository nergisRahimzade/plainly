import { FlatList, View, Text, Pressable, StyleSheet } from "react-native";
import { Trash2 } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";
import { colors, fonts, radii } from "../theme";

interface HistoryListProps {
  documents: PlainlyDocumentPublic[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}

export default function HistoryList({ documents, selectedId, onSelect, onDelete, emptyMessage }: HistoryListProps) {
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
      contentContainerStyle={{ paddingVertical: 4, paddingBottom: 24 }}
      renderItem={({ item }) => {
        const meta = getDocTypeMeta(item.docType);
        const Icon = meta.icon;
        const isSelected = item.id === selectedId;
        return (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              isSelected && styles.rowSelected,
              pressed && !isSelected && styles.rowPressed,
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Icon size={14} color={meta.color} strokeWidth={1.75} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {item.summary}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => onDelete(item.id)} style={styles.deleteButton}>
              <Trash2 size={14} color={colors.inkFaint} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginBottom: 2,
  },
  rowSelected: { backgroundColor: colors.accentSoft },
  rowPressed: { backgroundColor: colors.hairlineSoft },
  rowTitle: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink },
  rowSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  deleteButton: { padding: 4, marginTop: -2 },
  emptyBox: { paddingVertical: 40, alignItems: "center" },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkFaint,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 19,
  },
});
