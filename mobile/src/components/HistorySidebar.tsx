import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { Search, X, Plus } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "../types";
import HistoryList from "./HistoryList";
import { colors, fonts, SEARCH_DEBOUNCE_MS } from "../theme";

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

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (isSearchActive) onClearSearchRef.current();
      return;
    }
    const handle = setTimeout(() => onSearchRef.current(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce on query only, matching web
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
        ) : (
          <HistoryList
            documents={documents}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
            emptyMessage={
              isSearchActive ? "No matches found." : "Your explained screenshots will show up here."
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aside: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.ink,
  },
  tagline: {
    marginTop: 4,
    fontSize: 12,
    color: colors.inkFaint,
  },
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
  listWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
});
