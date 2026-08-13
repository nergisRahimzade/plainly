import { FlatList, View, Text, Pressable, StyleSheet } from "react-native";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";

interface HistoryListProps {
  documents: PlainlyDocumentPublic[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}

export default function HistoryList({ documents, onSelect, onDelete, emptyMessage }: HistoryListProps) {
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
      contentContainerStyle={{ paddingBottom: 24 }}
      renderItem={({ item }) => {
        const meta = getDocTypeMeta(item.docType);
        return (
          <Pressable style={styles.row} onPress={() => onSelect(item.id)} onLongPress={() => onDelete(item.id)}>
            <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
              <Text>{meta.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {item.summary}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  rowSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  emptyBox: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 13, color: "#94a3b8", textAlign: "center", paddingHorizontal: 24 },
});
