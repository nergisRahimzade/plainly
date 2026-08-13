import { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import DocumentDetail from "./src/components/DocumentDetail";
import HistoryList from "./src/components/HistoryList";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  uploadDocument,
} from "./src/lib/api";
import type { PlainlyDocumentPublic } from "./src/types";

export default function App() {
  const [documents, setDocuments] = useState<PlainlyDocumentPublic[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PlainlyDocumentPublic | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    setIsLoadingHistory(true);
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handlePickImage(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Plainly needs access to continue.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    const base64 = asset.base64;
    const mimeType = asset.mimeType || "image/jpeg";

    setIsAnalyzing(true);
    try {
      const doc = await uploadDocument(base64, mimeType);
      setSelectedDoc(doc);
      setDocuments((prev) => [doc, ...prev]);
      setIsSearchActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong analyzing that image.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelect(id: string) {
    const cached = documents.find((d) => d.id === id);
    if (cached) setSelectedDoc(cached);
    try {
      setSelectedDoc(await getDocument(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that document.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that document.");
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearchActive(true);
    setError(null);
    try {
      setDocuments(await searchDocuments(query.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
  }

  function handleClearSearch() {
    setQuery("");
    setIsSearchActive(false);
    refreshHistory();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoDot}>
            <Text style={{ fontSize: 16 }}>✨</Text>
          </View>
          <Text style={styles.logoText}>Plainly</Text>
        </View>
        {selectedDoc && (
          <Pressable onPress={() => setSelectedDoc(null)}>
            <Text style={styles.backLink}>← Back</Text>
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {selectedDoc ? (
        <DocumentDetail document={selectedDoc} onOpenRelated={handleSelect} />
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {isAnalyzing ? (
            <View style={styles.analyzing}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.analyzingText}>Reading your screenshot…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.tagline}>
                Confused by something? Snap or upload it — Plainly explains it in plain English.
              </Text>

              <View style={styles.actionsRow}>
                <Pressable style={styles.primaryButton} onPress={() => handlePickImage(true)}>
                  <Text style={styles.primaryButtonText}>📷 Take Photo</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => handlePickImage(false)}>
                  <Text style={styles.secondaryButtonText}>🖼️ Choose Image</Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your past uploads…"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearchActive && (
              <Pressable onPress={handleClearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>

          {isLoadingHistory ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#7c3aed" />
          ) : (
            <HistoryList
              documents={documents}
              onSelect={handleSelect}
              onDelete={handleDelete}
              emptyMessage={
                isSearchActive
                  ? "No matches found."
                  : "Your explained screenshots will show up here. Long-press an item to delete it."
              }
            />
          )}

          <Text style={styles.privacyNote}>
            🛡️ Plainly never stores account numbers, IDs, or other sensitive numbers — only what the
            document means.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f5fb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  backLink: { fontSize: 14, fontWeight: "600", color: "#7c3aed" },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  errorText: { color: "#be123c", fontSize: 13, fontWeight: "600" },
  tagline: { fontSize: 15, color: "#475569", marginBottom: 14, lineHeight: 21 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: { color: "#334155", fontWeight: "700", fontSize: 14 },
  analyzing: { alignItems: "center", paddingVertical: 30, gap: 10 },
  analyzingText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  clearButton: { marginLeft: -32, padding: 8 },
  clearButtonText: { color: "#94a3b8", fontWeight: "700" },
  privacyNote: { fontSize: 11, color: "#94a3b8", textAlign: "center", paddingVertical: 10 },
});
