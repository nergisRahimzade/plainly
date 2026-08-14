import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Dimensions } from "react-native";
import { Search, X, Plus, Sparkles } from "lucide-react-native";
import { colors, fonts, radii } from "../theme";
import type { PlainlyDocumentPublic } from "../types";
import HistoryList from "./HistoryList";

const SEARCH_DEBOUNCE_MS = 1000;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const SIDEBAR_WIDTH = Math.min(320, SCREEN_WIDTH * 0.85);

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  documents: PlainlyDocumentPublic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  onNewUpload: () => void;
  onAddExamples: () => void;
  isAddingExamples: boolean;
  footer?: React.ReactNode;
}

export default function Sidebar({
  visible,
  onClose,
  documents,
  selectedId,
  onSelect,
  onDelete,
  onSearch,
  onClearSearch,
  isSearchActive,
  onNewUpload,
  onAddExamples,
  isAddingExamples,
  footer,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const onClearSearchRef = useRef(onClearSearch);
  onClearSearchRef.current = onClearSearch;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -SIDEBAR_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (isSearchActive) onClearSearchRef.current();
      return;
    }
    const handle = setTimeout(() => onSearchRef.current(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>Plainly</Text>
          <Text style={styles.tagline}>Upload it. Understand it.</Text>

          <Pressable
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            onPress={() => {
              onNewUpload();
              onClose();
            }}
          >
            <Plus size={14} color={colors.paper} strokeWidth={2.5} />
            <Text style={styles.newButtonText}>New screenshot</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.exampleButton, pressed && styles.pressed]}
            onPress={onAddExamples}
            disabled={isAddingExamples}
          >
            <Sparkles size={13} color={colors.inkSoft} />
            <Text style={styles.exampleButtonText}>
              {isAddingExamples ? "Adding example documents…" : "Add example documents"}
            </Text>
          </Pressable>

          <View style={styles.searchRow}>
            <Search size={14} color={colors.inkFaint} style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your past uploads…"
              placeholderTextColor={colors.inkFaint}
              style={styles.searchInput}
              onSubmitEditing={() => {
                const trimmed = query.trim();
                if (trimmed) onSearch(trimmed);
              }}
              returnKeyType="search"
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

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <HistoryList
            documents={documents}
            selectedId={selectedId}
            onSelect={(id) => {
              onSelect(id);
              onClose();
            }}
            onDelete={onDelete}
            emptyMessage={
              isSearchActive
                ? "No matches found."
                : "Your explained screenshots will show up here."
            }
          />
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
  brandBlock: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  logo: { fontFamily: fonts.serifSemiBold, fontSize: 24, color: colors.ink },
  tagline: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  newButton: {
    marginTop: 18,
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
  exampleButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    paddingVertical: 9,
  },
  exampleButtonText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.inkSoft },
  searchRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: 8,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink, padding: 0 },
  searchLabel: {
    marginTop: 8,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.accent,
  },
});
