import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { Search, X, Plus, Trash2 } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "./types";
import { colors, fonts, getDocTypeMeta } from "./theme";

const SEARCH_DEBOUNCE_MS = 1000;

interface HistorySidebarProps {
  documents: PlainlyDocumentPublic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  onNewUpload: () => void;
  isLoading: boolean;
}

export default function HistorySidebar({
  documents,
  selectedId,
  onSelect,
  onDelete,
  onSearch,
  onClearSearch,
  isSearchActive,
  onNewUpload,
  isLoading,
}: HistorySidebarProps) {
  const [query, setQuery] = useState("");
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const onClearSearchRef = useRef(onClearSearch);
  onClearSearchRef.current = onClearSearch;
  const isSearchActiveRef = useRef(isSearchActive);
  isSearchActiveRef.current = isSearchActive;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (isSearchActiveRef.current) onClearSearchRef.current();
      return;
    }
    const handle = setTimeout(() => onSearchRef.current(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <View style={styles.aside}>
      <View style={styles.header}>
        <Text style={styles.brand}>Plainly</Text>
        <Text style={styles.tagline}>Upload it. Understand it.</Text>

        <Pressable
          onPress={onNewUpload}
          style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed]}
        >
          <Plus size={14} color={colors.paper} strokeWidth={2.5} />
          <Text style={styles.newBtnText}>New screenshot</Text>
        </Pressable>

        <View style={styles.searchWrap}>
          <Search size={14} color={colors.inkFaint} strokeWidth={1.75} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your past uploads…"
            placeholderTextColor={colors.inkFaint}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => {
              const trimmed = query.trim();
              if (trimmed) onSearch(trimmed);
            }}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery("");
                onClearSearch();
              }}
              hitSlop={8}
            >
              <X size={14} color={colors.inkFaint} />
            </Pressable>
          )}
        </View>
        {isSearchActive && <Text style={styles.searchLabel}>Semantic search results</Text>}
      </View>

      <View style={styles.listWrap}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.accent} />
        ) : documents.length === 0 ? (
          <Text style={styles.emptyText}>
            {isSearchActive ? "No matches found." : "Your explained screenshots will show up here."}
          </Text>
        ) : (
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aside: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  brand: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  tagline: { marginTop: 4, fontSize: 12, color: colors.inkFaint },
  newBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  newBtnPressed: { backgroundColor: colors.accent },
  newBtnText: { color: colors.paper, fontSize: 14, fontWeight: "500" },
  searchWrap: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
    fontSize: 14,
    color: colors.ink,
  },
  searchLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accent,
  },
  listWrap: { flex: 1, paddingHorizontal: 12, paddingBottom: 24 },
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
  emptyText: {
    paddingVertical: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkFaint,
    textAlign: "center",
  },
});
